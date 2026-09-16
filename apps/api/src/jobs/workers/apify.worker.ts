import { Worker } from "bullmq";
import { createBullConnection } from "../../config/redis";
import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { RUN_APIFY_ACTOR_JOB } from "../definitions/runApifyActor.job";
import { getActorRun, startActorRun } from "../../services/apify/actor.service";
import { markRunStarted } from "../../services/apify/run.service";
import { finalizeIngestion } from "../../services/apify/runIngestion.service";
import { recordRunOutcome } from "../../services/sources/sourceHealth.service";
import { prisma } from "../../config/database";

const POLL_INTERVAL_MS = 5000;
const MAX_CONSECUTIVE_POLL_FAILURES = 6;

export function startApifyWorker(): Worker {
  const worker = new Worker(
    "apify",
    async (job) => {
      if (job.name !== RUN_APIFY_ACTOR_JOB) {
        logger.warn({ jobName: job.name }, "apify_unknown_job");
        return;
      }

      const { sourceId, runId, actorId } = job.data as {
        sourceId: string;
        runId: string;
        actorId: string;
      };

      const source = await prisma.source.findUnique({ where: { id: sourceId } });
      if (!source) {
        logger.error({ sourceId }, "apify_source_not_found");
        return;
      }

      const metadata = (source.metadata as Record<string, unknown> | null) ?? {};

      try {
        const started = await startActorRun(actorId, {
          sourceId: source.id,
          sourceUrl: source.url,
          sourceType: source.sourceType,
          country: source.countryCode ?? undefined,
          category: source.category ?? undefined,
          adapter: source.adapter,
          waitUntil: metadata.waitUntil as never,
          waitForSelector: metadata.waitForSelector as never,
          waitExtraMs: metadata.waitExtraMs as never,
          listingSelector: metadata.listingSelector as never,
          interaction: metadata.interaction as never,
        });

        await markRunStarted(runId, started.id);
        logger.info(
          { runId, apifyRunId: started.id, sourceId },
          "apify_run_started",
        );

        const maxWaitMs = env.APIFY_DEFAULT_TIMEOUT_SECONDS * 1000;
        const startTime = Date.now();
        let finalStatus: string = started.status;
        let datasetId: string | null = started.defaultDatasetId;
        let consecutiveFailures = 0;

        while (Date.now() - startTime < maxWaitMs) {
          await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

          try {
            const run = await getActorRun(started.id);
            finalStatus = run.status;
            datasetId = run.defaultDatasetId;
            consecutiveFailures = 0;

            logger.info(
              { apifyRunId: started.id, status: run.status },
              "apify_run_polled",
            );

            if (
              run.status === "SUCCEEDED" ||
              run.status === "FAILED" ||
              run.status === "ABORTED" ||
              run.status === "TIMED-OUT"
            ) {
              if (run.status === "SUCCEEDED") {
                await finalizeIngestion({
                  runId,
                  apifyRunId: started.id,
                  apifyDatasetId: datasetId,
                  sourceId,
                });
              } else {
                logger.warn(
                  { runId, apifyRunId: started.id, finalStatus },
                  "apify_run_not_succeeded",
                );
                await recordRunOutcome({ sourceId, success: false, itemsFound: 0 });
              }
              return;
            }
          } catch (pollError) {
            consecutiveFailures += 1;
            logger.warn(
              {
                err: pollError,
                apifyRunId: started.id,
                consecutiveFailures,
              },
              "apify_run_poll_failed",
            );

            if (consecutiveFailures >= MAX_CONSECUTIVE_POLL_FAILURES) {
              logger.error(
                { apifyRunId: started.id, consecutiveFailures },
                "apify_run_poll_giving_up",
              );
              await recordRunOutcome({ sourceId, success: false, itemsFound: 0 });
              return;
            }
          }
        }

        logger.warn(
          { runId, apifyRunId: started.id },
          "apify_run_max_wait_exceeded",
        );
        await recordRunOutcome({ sourceId, success: false, itemsFound: 0 });
      } catch (error) {
        logger.error({ err: error, sourceId, runId }, "apify_actor_run_failed");
        await recordRunOutcome({ sourceId, success: false, itemsFound: 0 });
        throw error;
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