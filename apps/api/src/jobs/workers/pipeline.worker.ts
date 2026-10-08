import { logger } from "../../config/logger";
import { PROCESS_OPPORTUNITY_JOB } from "../definitions/processOpportunity.job";
import { prisma } from "../../config/database";
import { normalizeOpportunity } from "../../services/opportunities/normalization.service";
import { validateNormalized } from "../../services/opportunities/validation.service";
import {
  findPotentialDuplicate,
  recordDuplicateCandidate,
} from "../../services/opportunities/deduplication.service";
import { upsertCanonicalOpportunity } from "../../services/opportunities/canonical.service";
import { enqueueMatchUsers } from "../definitions/matchUsers.job";
import { analyzeOpportunity } from "../../services/ai/opportunityAnalyst.service";

export async function processPipelineJob(job: { name: string; payload: unknown }): Promise<void> {
      if (job.name !== PROCESS_OPPORTUNITY_JOB) {
        logger.warn({ jobName: job.name }, "pipeline_unknown_job");
        return;
      }

      const { rawOpportunityId, sourceId } = job.payload as {
        rawOpportunityId: string;
        sourceId: string;
      };

      const raw = await prisma.rawOpportunity.findUnique({
        where: { id: rawOpportunityId },
      });
      if (!raw) {
        logger.warn({ rawOpportunityId }, "pipeline_raw_not_found");
        return;
      }

      await prisma.rawOpportunity.update({
        where: { id: rawOpportunityId },
        data: { processingStatus: "PROCESSING" },
      });

      try {
        const normalized = normalizeOpportunity(raw.payload as never);
        const validation = validateNormalized(normalized);

        if (!validation.valid) {
          await prisma.rawOpportunity.update({
            where: { id: rawOpportunityId },
            data: {
              processingStatus: "FAILED",
              processingError: JSON.stringify(validation.issues),
            },
          });
          logger.warn({ rawOpportunityId, issues: validation.issues }, "pipeline_validation_failed");
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

        if (created) {
          try {
            await analyzeOpportunity(created.id, normalized);
          } catch (analysisError) {
            logger.warn(
              { opportunityId: created.id, err: analysisError },
              "opportunity_intelligence_failed_non_blocking",
            );
          }
          await enqueueMatchUsers({ opportunityId: created.id });
        }

        await prisma.rawOpportunity.update({
          where: { id: rawOpportunityId },
          data: { processingStatus: "PROCESSED", processedAt: new Date() },
        });
      } catch (error) {
        logger.error({ err: error, rawOpportunityId }, "pipeline_processing_failed");
        await prisma.rawOpportunity.update({
          where: { id: rawOpportunityId },
          data: {
            processingStatus: "FAILED",
            processingError: error instanceof Error ? error.message : "Unknown error",
          },
        });
        throw error;
      }
    }