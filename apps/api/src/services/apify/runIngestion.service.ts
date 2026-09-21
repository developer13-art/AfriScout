import { prisma } from "../../config/database";
import { logger } from "../../config/logger";
import { apifyActors } from "./actor.service";
import { fetchAllDatasetItems } from "./dataset.service";
import { createSourceRun, markRunFinished, markRunStarted } from "./run.service";
import { ingestRawItems } from "../opportunities/ingestion.service";
import { enqueueProcessOpportunity } from "../../jobs/definitions/processOpportunity.job";
import type { RunTrigger } from "@prisma/client";

export interface TriggerRunInput {
  sourceId: string;
  trigger: RunTrigger;
  createdBy?: string | null;
}

export interface SourceMetadata {
  waitUntil?: "load" | "domcontentloaded" | "networkidle" | "commit";
  waitForSelector?: string;
  waitExtraMs?: number;
  listingSelector?: string;
  interaction?: {
    fill?: Array<{ selector: string; value: string }>;
    check?: Array<{ selector: string }>;
    click?: string;
    waitFor?: string;
    extraWaitMs?: number;
  };
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

  logger.info({ sourceId: source.id, runId: run.id }, "ingestion_triggered");
  return run;
}

export async function buildActorInput(sourceId: string) {
  const source = await prisma.source.findUnique({ where: { id: sourceId } });
  if (!source) throw new Error("Source not found");

  const metadata = (source.metadata as SourceMetadata | null) ?? {};

  return {
    sourceId: source.id,
    sourceUrl: source.url,
    sourceType: source.sourceType,
    country: source.countryCode ?? undefined,
    category: source.category ?? undefined,
    adapter: source.adapter,
    waitUntil: metadata.waitUntil,
    waitForSelector: metadata.waitForSelector,
    waitExtraMs: metadata.waitExtraMs,
    listingSelector: metadata.listingSelector,
    interaction: metadata.interaction,
  };
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
      itemsUnchanged: 0,
      itemsInvalid: 0,
      errorMessage: "No dataset was produced by the actor run",
    });
    return;
  }

  const items = await fetchAllDatasetItems(input.apifyDatasetId);

  const result = await ingestRawItems(
    input.sourceId,
    { id: input.runId } as never,
    items.map((payload, index) => ({
      sourceId: input.sourceId,
      sourceRunId: input.runId,
      apifyDatasetItemId:
        typeof payload.id === "string" ? payload.id : String(index),
      payload: payload as Record<string, unknown>,
    })),
  );

  // After raw items are stored, enqueue pipeline processing for each one.
  const raws = await prisma.rawOpportunity.findMany({
    where: { sourceRunId: input.runId, processingStatus: "PENDING" },
    select: { id: true },
  });

  for (const raw of raws) {
    await enqueueProcessOpportunity({
      rawOpportunityId: raw.id,
      sourceId: input.sourceId,
    });
  }

  await markRunFinished({
    runId: input.runId,
    status: "SUCCEEDED",
    itemsFound: items.length,
    itemsImported: result.imported,
    itemsUpdated: result.updated,
    itemsDuplicate: 0,
    itemsUnchanged: result.unchanged,
    itemsInvalid: result.invalid,
    apifyDatasetId: input.apifyDatasetId,
  });

  logger.info(
    { runId: input.runId, sourceId: input.sourceId, enqueued: raws.length },
    "ingestion_finalized",
  );
}