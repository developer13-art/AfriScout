import { Worker } from "bullmq";
import { createBullConnection } from "../../config/redis";
import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { PROCESS_OPPORTUNITY_JOB } from "../definitions/processOpportunity.job";
import { INGEST_APIFY_DATASET_JOB } from "../definitions/ingestApifyDataset.job";
import { DETECT_CHANGES_JOB } from "../definitions/detectChanges.job";
import { DEDUPLICATE_JOB } from "../definitions/deduplicate.job";
import { prisma } from "../../config/database";
import { normalizeOpportunity } from "../../services/opportunities/normalization.service";
import { validateNormalized } from "../../services/opportunities/validation.service";
import { findPotentialDuplicate, recordDuplicateCandidate } from "../../services/opportunities/deduplication.service";
import { upsertCanonicalOpportunity } from "../../services/opportunities/canonical.service";
import { fetchAllDatasetItems } from "../../services/apify/dataset.service";

export function startPipelineWorker(): Worker {
  const worker = new Worker(
    "pipeline",
    async (job) => {
      logger.info({ jobName: job.name, jobId: job.id }, "pipeline_job_started");

      switch (job.name) {
        case PROCESS_OPPORTUNITY_JOB: {
          const { rawOpportunityId, sourceId } = job.data as {
            rawOpportunityId: string;
            sourceId: string;
          };

          const raw = await prisma.rawOpportunity.findUnique({
            where: { id: rawOpportunityId },
          });
          if (!raw) return;

          const normalized = normalizeOpportunity(raw.payload as never);
          const validation = validateNormalized(normalized);

          if (!validation.valid) {
            await prisma.rawOpportunity.update({
              where: { id: rawOpportunityId },
              data: { processingStatus: "FAILED", processingError: JSON.stringify(validation.issues) },
            });
            return;
          }

          const duplicate = await findPotentialDuplicate({
            title: normalized.title,
            organizationName: normalized.organizationName,
            deadline: normalized.deadline,
            countryCode: normalized.countryCode,
            sourceUrl: normalized.sourceUrl,
          });

          const created = await upsertCanonicalOpportunity(
            normalized,
            sourceId,
            rawOpportunityId,
            raw.sourceRunId,
          );

          if (duplicate.duplicate && duplicate.canonicalId && created) {
            await recordDuplicateCandidate({
              canonicalId: duplicate.canonicalId,
              candidateId: created.id,
              similarity: duplicate.similarity,
              signals: duplicate.signals,
            });
          }

          await prisma.rawOpportunity.update({
            where: { id: rawOpportunityId },
            data: { processingStatus: "PROCESSED", processedAt: new Date() },
          });
          break;
        }

        case INGEST_APIFY_DATASET_JOB: {
          const { sourceId, runId, datasetId } = job.data as {
            sourceId: string;
            runId: string;
            datasetId: string;
          };
          const items = await fetchAllDatasetItems(datasetId);
          for (const item of items) {
            const payloadHash = JSON.stringify(item).slice(0, 64);
            try {
              const raw = await prisma.rawOpportunity.create({
                data: {
                  sourceId,
                  sourceRunId: runId,
                  apifyDatasetItemId: typeof item.id === "string" ? item.id : null,
                  payload: item as never,
                  payloadHash,
                  processingStatus: "PENDING",
                },
              });
              const { enqueueProcessOpportunity } = await import(
                "../definitions/processOpportunity.job"
              );
              await enqueueProcessOpportunity({
                rawOpportunityId: raw.id,
                sourceId,
              });
            } catch (error) {
              logger.warn({ err: error, sourceId }, "pipeline_duplicate_raw_skipped");
            }
          }
          break;
        }

        case DETECT_CHANGES_JOB: {
          const { opportunityId } = job.data as { opportunityId: string };
          const { snapshotOpportunity, detectAndRecordChanges } = await import(
            "../../services/opportunities/changeDetection.service"
          );
          const snapshot = await snapshotOpportunity(opportunityId);
          const versions = await prisma.opportunityVersion.findMany({
            where: { opportunityId },
            orderBy: { version: "desc" },
            take: 1,
          });
          const previous = versions[0]?.snapshot as Record<string, unknown> | undefined;
          if (previous) {
            await detectAndRecordChanges(opportunityId, previous, snapshot);
          }
          break;
        }

        case DEDUPLICATE_JOB: {
          const { opportunityId } = job.data as { opportunityId: string };
          const opportunity = await prisma.opportunity.findUnique({
            where: { id: opportunityId },
          });
          if (opportunity) {
            const duplicate = await findPotentialDuplicate({
              title: opportunity.title,
              organizationName: opportunity.organizationName,
              deadline: opportunity.deadline?.toISOString() ?? null,
              countryCode: opportunity.countryCode,
              sourceUrl: "",
            });
            if (duplicate.duplicate && duplicate.canonicalId) {
              await recordDuplicateCandidate({
                canonicalId: duplicate.canonicalId,
                candidateId: opportunity.id,
                similarity: duplicate.similarity,
                signals: duplicate.signals,
              });
            }
          }
          break;
        }

        default:
          logger.warn({ jobName: job.name }, "pipeline_unknown_job");
      }
    },
    {
      connection: createBullConnection(),
      prefix: env.QUEUE_PREFIX,
      concurrency: env.WORKER_CONCURRENCY,
    },
  );

  worker.on("failed", (job, err) => {
    logger.error({ jobId: job?.id, err }, "pipeline_job_failed");
  });

  return worker;
}