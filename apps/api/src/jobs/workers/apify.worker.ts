import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { RUN_APIFY_ACTOR_JOB } from "../definitions/runApifyActor.job";
import { getActorRun, startActorRun } from "../../services/apify/actor.service";
import { markRunFinished, markRunStarted } from "../../services/apify/run.service";
import { buildActorInput, finalizeIngestion } from "../../services/apify/runIngestion.service";
import { recordRunOutcome } from "../../services/sources/sourceHealth.service";
import { prisma } from "../../config/database";

const POLL_INTERVAL_MS = 5000;
const MAX_CONSECUTIVE_POLL_FAILURES = 6;

async function finishRunWithFailure(
  runId: string,
  message: string,
  status: "FAILED" | "ABORTED" | "TIMED_OUT" = "FAILED",
  details?: Record<string, unknown>,
): Promise<void> {
  await markRunFinished({
    runId,
    status,
    itemsFound: 0,
    itemsImported: 0,
    itemsUpdated: 0,
    itemsDuplicate: 0,
    itemsUnchanged: 0,
    itemsInvalid: 0,
    errorMessage: message,
    errorDetails: details ?? null,
  });
}

export async function processApifyJob(job: { name: string; payload: unknown }): Promise<void> {
  if (job.name !== RUN_APIFY_ACTOR_JOB) {
    logger.warn({ jobName: job.name }, "apify_unknown_job");
    return;
  }

  const { sourceId, runId, actorId } = job.payload as {
    sourceId: string;
    runId: string;
    actorId: string;
  };

  const source = await prisma.source.findUnique({ where: { id: sourceId } });
  if (!source) {
    logger.error({ sourceId, runId }, "apify_source_not_found");
    await finishRunWithFailure(runId, "The source was deleted before the discovery run started.");
    return;
  }

  try {
    const actorInput = await buildActorInput(sourceId);
    const started = await startActorRun(actorId, actorInput);

    await markRunStarted(runId, started.id);
    logger.info({ runId, apifyRunId: started.id, sourceId, actorId }, "apify_run_started");

    const maxWaitMs = env.APIFY_DEFAULT_TIMEOUT_SECONDS * 1000;
    const startTime = Date.now();
    let finalStatus: string = started.status;
    let datasetId: string | null = started.defaultDatasetId;
    let consecutiveFailures = 0;

    while (Date.now() - startTime < maxWaitMs) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

      try {
        const run = await getActorRun(started.id);
        finalStatus = run.status;
        datasetId = run.defaultDatasetId;
        consecutiveFailures = 0;

        logger.info({ apifyRunId: started.id, status: run.status }, "apify_run_polled");

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
            const status =
              run.status === "ABORTED"
                ? "ABORTED"
                : run.status === "TIMED-OUT"
                  ? "TIMED_OUT"
                  : "FAILED";
            await finishRunWithFailure(
              runId,
              `Apify actor finished with status ${run.status}.`,
              status,
              { apifyRunId: started.id, actorId, finalStatus },
            );
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
          { err: pollError, apifyRunId: started.id, consecutiveFailures },
          "apify_run_poll_failed",
        );

        if (consecutiveFailures >= MAX_CONSECUTIVE_POLL_FAILURES) {
          logger.error(
            { apifyRunId: started.id, consecutiveFailures },
            "apify_run_poll_giving_up",
          );
          await finishRunWithFailure(
            runId,
            "Unable to check the Apify run status after repeated API errors.",
            "FAILED",
            { apifyRunId: started.id, actorId, consecutiveFailures },
          );
          await recordRunOutcome({ sourceId, success: false, itemsFound: 0 });
          return;
        }
      }
    }

    logger.warn({ runId, apifyRunId: started.id }, "apify_run_max_wait_exceeded");
    await finishRunWithFailure(
      runId,
      `Apify actor did not finish within ${env.APIFY_DEFAULT_TIMEOUT_SECONDS} seconds.`,
      "TIMED_OUT",
      { apifyRunId: started.id, actorId },
    );
    await recordRunOutcome({ sourceId, success: false, itemsFound: 0 });
  } catch (error) {
    logger.error({ err: error, sourceId, runId }, "apify_actor_run_failed");
    try {
      await finishRunWithFailure(
        runId,
        error instanceof Error ? error.message : "Apify discovery failed unexpectedly.",
        "FAILED",
        { sourceId, actorId },
      );
    } catch (statusError) {
      logger.error(
        { err: statusError, sourceId, runId },
        "apify_run_failure_status_update_failed",
      );
    }
    try {
      await recordRunOutcome({ sourceId, success: false, itemsFound: 0 });
    } catch (healthError) {
      logger.warn({ err: healthError, sourceId, runId }, "apify_source_health_update_failed");
    }
    throw error;
  }
}