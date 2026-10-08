import { createHash } from "node:crypto";
import { prisma } from "../../config/database";
import { ConflictError, NotFoundError, UnauthorizedError } from "../../utils/errors";
import {
  createMemoTransaction,
  verifyMemoReceipt,
} from "../solana/solanaReceipt.service";

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

async function getCurrentRecord(opportunityId: string) {
  const opportunity = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
    include: { sources: { select: { sourceUrl: true } } },
  });
  if (!opportunity) throw new NotFoundError("Opportunity not found");
  const sourceUrls = opportunity.sources.map((source) => source.sourceUrl).sort();
  const record = {
    id: opportunity.id,
    title: opportunity.title,
    organizationName: opportunity.organizationName ?? null,
    category: opportunity.category,
    opportunityType: opportunity.opportunityType,
    countryCode: opportunity.countryCode ?? null,
    deadline: opportunity.deadline?.toISOString() ?? null,
    applicationUrl: opportunity.applicationUrl ?? null,
    updatedAt: opportunity.updatedAt.toISOString(),
    sourceUrls,
  };
  return {
    contentHash: hash(JSON.stringify(record)),
    sourceHash: hash(JSON.stringify(sourceUrls)),
  };
}

async function requireLinkedWallet(userId: string, walletAddress: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { walletAddress: true, walletVerifiedAt: true },
  });
  if (user?.walletAddress !== walletAddress || !user.walletVerifiedAt) {
    throw new UnauthorizedError("Connect and verify the wallet linked to your Scout account");
  }
  return walletAddress;
}

function opportunityMemo(
  opportunityId: string,
  contentHash: string,
  sourceHash: string,
) {
  return JSON.stringify({
    protocol: "scout-opportunity-proof-v1",
    opportunityId,
    contentHash,
    sourceHash,
    network: "devnet",
  });
}

export async function createOpportunityProofTransaction(
  opportunityId: string,
  userId: string,
  walletAddress: string,
) {
  const wallet = await requireLinkedWallet(userId, walletAddress);
  const { contentHash, sourceHash } = await getCurrentRecord(opportunityId);
  const existing = await prisma.opportunityProvenanceProof.findUnique({
    where: { opportunityId_contentHash: { opportunityId, contentHash } },
  });
  if (existing) throw new ConflictError("This exact opportunity version is already anchored");
  return {
    transaction: await createMemoTransaction(
      wallet,
      opportunityMemo(opportunityId, contentHash, sourceHash),
    ),
    contentHash,
    sourceHash,
  };
}

export async function recordOpportunityProof(
  opportunityId: string,
  userId: string,
  signature: string,
) {
  const opportunity = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
    select: { id: true },
  });
  if (!opportunity) throw new NotFoundError("Opportunity not found");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { walletAddress: true, walletVerifiedAt: true },
  });
  if (!user?.walletAddress || !user.walletVerifiedAt) {
    throw new UnauthorizedError("Connect and verify a Solana wallet before anchoring provenance");
  }
  const { contentHash, sourceHash } = await getCurrentRecord(opportunityId);
  await verifyMemoReceipt(
    signature,
    user.walletAddress,
    opportunityMemo(opportunityId, contentHash, sourceHash),
  );
  return prisma.opportunityProvenanceProof.create({
    data: {
      opportunityId,
      contentHash,
      sourceHash,
      walletAddress: user.walletAddress,
      txSignature: signature,
    },
  });
}
