#!/usr/bin/env tsx
import { startActorRun, getActorRun } from "../apps/api/src/services/apify/actor.service";
import { apifyConfig } from "../apps/api/src/config/apify";
import { logger } from "../apps/api/src/config/logger";

async function main(): Promise<void> {
  const actorId = process.argv[2] ?? apifyConfig.actors.opportunityDiscovery;
  const sourceUrl = process.argv[3];
  const sourceId = process.argv[4] ?? "cli-test";
  const adapter = process.argv[5] ?? "genericListing";

  if (!actorId) {
    console.error("Actor ID is required.");
    process.exit(1);
  }
  if (!sourceUrl) {
    console.error("Usage: tsx scripts/run-actor.ts <actorId> <sourceUrl> [sourceId] [adapter]");
    process.exit(1);
  }

  logger.info({ actorId, sourceUrl, sourceId, adapter }, "cli_actor_run_start");

  const started = await startActorRun(actorId, {
    sourceId,
    sourceUrl,
    sourceType: "OTHER",
    adapter,
  });

  logger.info({ runId: started.id, datasetId: started.defaultDatasetId }, "cli_actor_run_started");

  const pollIntervalMs = 3000;
  const started_at = Date.now();
  const maxWaitMs = 5 * 60 * 1000;

  while (Date.now() - started_at < maxWaitMs) {
    const run = await getActorRun(started.id);
    if (["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"].includes(run.status)) {
      logger.info(
        { runId: run.id, status: run.status, datasetId: run.defaultDatasetId },
        "cli_actor_run_finished",
      );
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  logger.warn({ runId: started.id }, "cli_actor_run_timeout");
}

void main().catch((error) => {
  logger.error({ err: error }, "cli_actor_run_failed");
  process.exit(1);
});