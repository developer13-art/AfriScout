import { logger } from "../../config/logger";
import { env } from "../../config/env";
import { dueSources } from "../../services/sources/sourceSchedule.service";
import { enqueueRunApifyActor } from "../definitions/runApifyActor.job";
import { prisma } from "../../config/database";
import { apifyActors } from "../../services/apify/actor.service";
import { createSourceRun } from "../../services/apify/run.service";

export async function tickSourceScheduler(): Promise<number> {
  if (!env.SCHEDULER_ENABLED) return 0;
  const due = await dueSources();
  let enqueued = 0;

  for (const source of due) {
    if (!apifyActors.opportunityDiscovery) {
      logger.warn({ sourceId: source.sourceId }, "source_scheduler_missing_actor");
      continue;
    }
    const sourceRow = await prisma.source.findUnique({ where: { id: source.sourceId } });
    if (!sourceRow) continue;

    const run = await createSourceRun({
      sourceId: source.sourceId,
      actorId: apifyActors.opportunityDiscovery,
      trigger: "SCHEDULE",
    });

    await enqueueRunApifyActor({
      sourceId: source.sourceId,
      runId: run.id,
      actorId: apifyActors.opportunityDiscovery,
    });
    enqueued += 1;
  }

  logger.info({ enqueued }, "source_scheduler_tick");
  return enqueued;
}