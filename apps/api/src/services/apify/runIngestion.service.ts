import { prisma } from "../../config/database";
import { logger } from "../../config/logger";
import { apifyActors } from "./actor.service";
import { fetchAllDatasetItems } from "./dataset.service";
import { createSourceRun, markRunFinished, markRunStarted } from "./run.service";
import { ingestRawItems } from "../opportunities/ingestion.service";
import type { RunTrigger } from "@prisma/client";

export interface TriggerRunInput {
  sourceId: string;
  trigger: RunTrigger;
  createdBy?: string | null;
}

export async function triggerIngestion(input: TriggerRunInput) {
  const source = await prisma.source.findUnique({ where: { id: input.sourceId } });
  if (!source) throw new Error("Source not found");

  const run = await createSourceRun({
    sourceId: source.id,
    actorId: apifyActors.opportunityDiscovery || "unconfigured",
    trigger: input.trigger,
    createdBy: input.createdBy ?? null,
  });

  // Actual Apify run starts via jobs/runApifyActor.job. This function
  // records the SourceRun row and returns immediately for the worker to
  // pick up. It is intentionally not synchronous.
  logger.info({ sourceId: source.id, runId: run.id }, "ingestion_triggered");
  return run;
}

export async function finalizeIngestion(input: {
  runId: string;
  apifyRunId: string;
  apifyDatasetId: string | null;
  sourceId: string;
}): Promise<void> {
  await markRunStarted(input.runId, input.apifyRunId);

  if (!input.apifyDatasetId) {
    await markRunFinished({
      runId: input.runId,
      status: "FAILED",
      itemsFound: 0,
      itemsImported: 0,
      itemsUpdated: 0,
      itemsDuplicate: 0,
      itemsInvalid: 0,
      errorMessage: "No dataset was produced by the actor run",
    });
    return;
  }

  const items = await fetchAllDatasetItems(input.apifyDatasetId);

  const result = await ingestRawItems(input.sourceId, { id: input.runId } as never, items.map((payload, index) => ({
    sourceId: input.sourceId,
    sourceRunId: input.runId,
    apifyDatasetItemId:
      typeof payload.id === "string" ? payload.id : String(index),
    payload: payload as Record<string, unknown>,
  })));

  await markRunFinished({
    runId: input.runId,
    status: "SUCCEEDED",
    itemsFound: items.length,
    itemsImported: result.imported,
    itemsUpdated: 0,
    itemsDuplicate: result.duplicates,
    itemsInvalid: result.failed,
    apifyDatasetId: input.apifyDatasetId,
  });
}