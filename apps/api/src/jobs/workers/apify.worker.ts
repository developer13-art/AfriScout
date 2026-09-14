import { Worker } from "bullmq";
import { createBullConnection } from "../../config/redis";
import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { RUN_APIFY_ACTOR_JOB } from "../definitions/runApifyActor.job";
import { INGEST_APIFY_DATASET_JOB } from "../definitions/ingestApifyDataset.job";
import { getActorRun, startActorRun } from "../../services/apify/actor.service";
import { markRunStarted } from "../../services/apify/run.service";
import { enqueueIngestApifyDataset } from "../definitions/ingestApifyDataset.job";
import { prisma } from "../../config/database";
import { recordRunOutcome } from "../../services/sources/sourceHealth.service";
import { env as envConfig } from "../../config/env";

export function startApifyWorker(): Worker {
  const worker = new Worker(
    "apify",
    async (job) => {
      switch (job.name) {
        case RUN_APIFY_ACTOR_JOB: {
          const { sourceId, runId, actorId } = job.data as {
            sourceId: string;
            runId: string;
            actorId: string;
          };
          const source = await prisma.source.findUnique({ where: { id: sourceId } });
          if (!source) return;

          try {
            const started = await startActorRun(actorId, {
              sourceId: source.id,
              sourceUrl: source.url,
              sourceType: source.sourceType,
              country: source.countryCode ?? undefined,
              category: source.category ?? undefined,
              adapter: source.adapter,
            });
            await markRunStarted(runId, started.id);

            const pollIntervalMs = 3000;
            const maxWaitMs = envConfig.APIFY_DEFAULT_TIMEOUT_SECONDS * 1000;
            const startTime = Date.now();
            let finished = false;
            let itemsFound = 0;

            while (Date.now() - startTime < maxWaitMs) {
              const run = await getActorRun(started.id);
              if (["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"].includes(run.status)) {
                finished = run.status === "SUCCEEDED";
                if (run.defaultDatasetId) {
                  await enqueueIngestApifyDataset({
                    sourceId,
                    runId,
                    datasetId: run.defaultDatasetId,
                  });
                }
                itemsFound = 0;
                break;
              }
              await new Promise((r) => setTimeout(r, pollIntervalMs));
            }

            await recordRunOutcome({ sourceId, success: finished, itemsFound });
          } catch (error) {
            logger.error({ err: error, sourceId, runId }, "apify_actor_run_failed");
            await recordRunOutcome({ sourceId, success: false, itemsFound: 0 });
          }
          break;
        }
        case INGEST_APIFY_DATASET_JOB: {
          // Handled by the pipeline worker via its own ingester. This case
          // exists to keep the queue compatible with direct dataset ingestion.
          break;
        }
        default:
          logger.warn({ jobName: job.name }, "apify_unknown_job");
      }
    },
    {
      connection: createBullConnection(),
      prefix: env.QUEUE_PREFIX,
      concurrency: 2,
    },
  );

  worker.on("failed", (job, err) => {
    logger.error({ jobId: job?.id, err }, "apify_job_failed");
  });

  return worker;
}