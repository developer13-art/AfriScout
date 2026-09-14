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
  duplicates: number;
  failed: number;
}

export async function ingestRawItems(
  sourceId: string,
  sourceRun: SourceRun,
  items: IngestItemInput[],
): Promise<IngestResult> {
  let imported = 0;
  let duplicates = 0;
  let failed = 0;

  for (const item of items) {
    const payloadHash = hashObject(item.payload);

    try {
      const existing = await prisma.rawOpportunity.findFirst({
        where: { payloadHash, sourceId },
        select: { id: true },
      });

      if (existing) {
        duplicates += 1;
        continue;
      }

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
      failed += 1;
      logger.error(
        { err: error, sourceId, apifyDatasetItemId: item.apifyDatasetItemId },
        "raw_opportunity_insert_failed",
      );
    }
  }

  logger.info(
    { sourceId, sourceRunId: sourceRun.id, imported, duplicates, failed },
    "raw_ingestion_completed",
  );

  return { imported, duplicates, failed };
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