import { prisma } from "../../config/database";
import { hashObject } from "../../utils/hash";
import { logger } from "../../config/logger";
import type { SourceRun } from "@prisma/client";

export interface IngestItemInput {
  sourceId: string;
  sourceRunId: string;
  apifyDatasetItemId: string | null;
  payload: Record<string, unknown>;
}

export interface IngestResult {
  imported: number;
  updated: number;
  unchanged: number;
  invalid: number;
}

// Fields that matter for change detection. Any difference here means a
// material update the user should be notified about. Everything else
// (timestamps in footers, cosmetic HTML) is ignored.
const TRACKED_FIELDS = [
  "title",
  "organization",
  "deadline",
  "requirements",
  "eligibility",
  "description",
  "valueMin",
  "valueMax",
  "currency",
  "location",
  "country",
  "referenceNumber",
  "documents",
] as const;

function canonicaliseForDiff(payload: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of TRACKED_FIELDS) {
    const value = payload[key];
    if (value === undefined || value === null) {
      out[key] = null;
    } else if (typeof value === "string") {
      out[key] = value.trim().replace(/\s+/g, " ");
    } else if (Array.isArray(value)) {
      out[key] = [...value].map((v) => String(v).trim()).sort();
    } else {
      out[key] = value;
    }
  }
  return out;
}

export async function ingestRawItems(
  sourceId: string,
  sourceRun: SourceRun,
  items: IngestItemInput[],
): Promise<IngestResult> {
  let imported = 0;
  let updated = 0;
  let unchanged = 0;
  let invalid = 0;

  for (const item of items) {
    try {
      const payloadHash = hashObject(item.payload);

      const existingRaw = await prisma.rawOpportunity.findFirst({
        where: { payloadHash, sourceId },
        select: { id: true },
      });

      if (existingRaw) {
        // We've seen this exact raw payload before. Do NOT skip silently.
        // Compare against the current snapshot of the canonical opportunity
        // to determine if the source has actually changed something material.
        const link = await prisma.opportunitySource.findFirst({
          where: { sourceId, rawOpportunityId: existingRaw.id },
          select: { opportunityId: true },
        });

        // If we don't have a canonical opportunity linked, treat as unchanged.
        if (!link) {
          unchanged += 1;
          await prisma.rawOpportunity.update({
            where: { id: existingRaw.id },
            data: { fetchedAt: new Date() },
          });
          continue;
        }

        const latestVersion = await prisma.opportunityVersion.findFirst({
          where: { opportunityId: link.opportunityId },
          orderBy: { version: "desc" },
          select: { snapshot: true, version: true },
        });

        const incoming = canonicaliseForDiff(item.payload);
        const incomingHash = hashObject(incoming);

        const previous =
          latestVersion && typeof latestVersion.snapshot === "object"
            ? (latestVersion.snapshot as Record<string, unknown>)
            : null;
        const previousHash = previous ? hashObject(canonicaliseForDiff(previous)) : null;

        if (previousHash === incomingHash) {
          // Source unchanged. Record the fresh view and move on.
          unchanged += 1;
          await prisma.rawOpportunity.update({
            where: { id: existingRaw.id },
            data: { fetchedAt: new Date() },
          });
          await prisma.opportunitySource.updateMany({
            where: { sourceId, rawOpportunityId: existingRaw.id },
            data: { lastSeenAt: new Date() },
          });
        } else {
          // Material change detected. Do NOT create a new raw record — the
          // raw payload is the same as existingRaw (that is why we found it
          // by payload hash). Instead, re-queue the existing raw for
          // processing so the pipeline stores a new version and emits
          // change events.
          await prisma.rawOpportunity.update({
            where: { id: existingRaw.id },
            data: {
              sourceRunId: sourceRun.id,
              processingStatus: "PENDING",
              fetchedAt: new Date(),
            },
          });

          await prisma.opportunitySource.updateMany({
            where: { sourceId, rawOpportunityId: existingRaw.id },
            data: { lastSeenAt: new Date() },
          });

          updated += 1;
        }
        continue;
      }

      // Brand new raw item. Insert and let the pipeline process it.
      await prisma.rawOpportunity.create({
        data: {
          sourceId,
          sourceRunId: sourceRun.id,
          apifyDatasetItemId: item.apifyDatasetItemId,
          payload: item.payload as never,
          payloadHash,
          processingStatus: "PENDING",
        },
      });
      imported += 1;
    } catch (error) {
      invalid += 1;
      logger.error(
        { err: error, sourceId, apifyDatasetItemId: item.apifyDatasetItemId },
        "raw_opportunity_insert_failed",
      );
    }
  }

  logger.info(
    { sourceId, sourceRunId: sourceRun.id, imported, updated, unchanged, invalid },
    "raw_ingestion_completed",
  );

  return { imported, updated, unchanged, invalid };
}

export async function markRawProcessing(
  rawId: string,
  status: "PENDING" | "PROCESSING" | "PROCESSED" | "FAILED" | "SKIPPED",
  errorMessage?: string,
) {
  await prisma.rawOpportunity.update({
    where: { id: rawId },
    data: {
      processingStatus: status,
      processingError: errorMessage ?? null,
      processedAt: status === "PROCESSED" ? new Date() : undefined,
    },
  });
}