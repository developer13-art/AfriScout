import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/database";
import { logger } from "../../config/logger";
import { NotFoundError, ValidationError } from "../../utils/errors";
import { signVerificationBatch } from "../solana/solanaBatchSigner.service";
import { verifyMemoReceipt } from "../solana/solanaReceipt.service";
import { buildVerificationBatch } from "./verificationBatch.engine";

export { buildVerificationBatch } from "./verificationBatch.engine";
export type { VerificationBatchCandidate } from "./verificationBatch.engine";

export function buildBatchMemo(sourceRunId: string, rootHash: string): string {
  return JSON.stringify({
    protocol: "scout-verification-batch-v1",
    sourceRunId,
    rootHash,
    network: "devnet",
  });
}

export async function verifySourceRunBatch(sourceRunId: string): Promise<void> {
  const sourceRun = await prisma.sourceRun.findUnique({
    where: { id: sourceRunId },
    include: {
      verificationBatch: true,
      source: {
        select: {
          id: true,
          active: true,
          health: true,
          trusted: true,
          officialSource: true,
        },
      },
    },
  });
  if (!sourceRun) throw new NotFoundError("Source run not found");
  if (sourceRun.verificationBatch) return;

  const runSources = await prisma.rawOpportunity.findMany({
    where: { sourceRunId },
    include: {
      opportunitySources: {
        select: { opportunityId: true, sourceUrl: true },
      },
    },
  });
  const opportunityIds = Array.from(
    new Set(runSources.flatMap((raw) => raw.opportunitySources.map((source) => source.opportunityId))),
  );
  if (opportunityIds.length === 0) {
    throw new ValidationError("No committed opportunities were found for this source run");
  }

  const opportunities = await prisma.opportunity.findMany({
    where: { id: { in: opportunityIds } },
    include: {
      aiAnalyses: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  const candidates = opportunities.map((opportunity) => {
    const sourceUrl = runSources
      .flatMap((raw) => raw.opportunitySources)
      .find((source) => source.opportunityId === opportunity.id)?.sourceUrl ?? "";
    const analysis = opportunity.aiAnalyses[0];
    return {
      opportunityId: opportunity.id,
      title: opportunity.title,
      organizationName: opportunity.organizationName,
      deadline: opportunity.deadline?.toISOString() ?? null,
      sourceUrl,
      countryCode: opportunity.countryCode,
      category: opportunity.category,
      description: opportunity.description,
      sourceConfidence: sourceRun.source?.trusted && sourceRun.source.active && sourceRun.source.health === "HEALTHY" ? 1 : 0,
      aiConfidence: Number(analysis?.confidence ?? 0),
      dataCompleteness: Number(analysis?.confidence ?? 0),
      duplicateRisk: 0,
    };
  });
  const batch = buildVerificationBatch(sourceRunId, candidates);
  const persistedBatch = await prisma.verificationBatch.create({
    data: {
      sourceRunId,
      sourceId: sourceRun.sourceId,
      rootHash: batch.rootHash,
      recordCount: batch.recordCount,
      status: "ROOT_READY",
      opportunityVerifications: {
        create: batch.records.map((record) => ({
          opportunity: { connect: { id: record.opportunityId } },
          hash: record.hash,
          status: "PENDING",
          sourceConfidence: record.sourceConfidence,
          aiConfidence: record.aiConfidence,
          dataCompleteness: record.dataCompleteness,
          merkleProof: JSON.parse(JSON.stringify(record.merkleProof)) as unknown as Prisma.InputJsonObject,
        })),
      },
    },
  });

  try {
    const memo = buildBatchMemo(sourceRunId, batch.rootHash);
    const signed = await signVerificationBatch(sourceRunId, batch.rootHash);
    await verifyMemoReceipt(signed.signature, signed.payer, memo);
    await prisma.verificationBatch.update({
      where: { id: persistedBatch.id },
      data: {
        status: "ANCHORED",
        solanaSignature: signed.signature,
        verifiedAt: new Date(),
        opportunityVerifications: {
          updateMany: {
            where: { batchId: persistedBatch.id, status: "PENDING" },
            data: {
              status: "VERIFIED",
              solanaTx: signed.signature,
              verifiedAt: new Date(),
            },
          },
        },
      },
    });
    await prisma.opportunity.updateMany({
      where: { id: { in: batch.records.map((record) => record.opportunityId) } },
      data: { verificationStatus: "VERIFIED", verifiedAt: new Date() },
    });
    logger.info(
      { sourceRunId, batchId: persistedBatch.id, records: batch.recordCount },
      "verification_batch_anchored",
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown verification error";
    await prisma.verificationBatch.update({
      where: { id: persistedBatch.id },
      data: { status: "FAILED", errorMessage: message },
    });
    logger.error({ sourceRunId, err: error }, "verification_batch_failed");
    throw error;
  }
}

export function hashVerificationBatch(sourceRunId: string, rootHash: string): string {
  return createHash("sha256").update(`${sourceRunId}:${rootHash}`).digest("hex");
}
