import { createHash } from "node:crypto";
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { prisma } from "../../config/database";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../../utils/errors";
import { generateOpportunitySlug } from "../opportunities/opportunity.service";

const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
const connection = new Connection("https://api.devnet.solana.com", "confirmed");

const bountyInclude = {
  opportunity: true,
  organization: { select: { id: true, name: true, slug: true, verified: true } },
  _count: { select: { submissions: true } },
} as const;

export async function listOpenBounties() {
  return prisma.bounty.findMany({
    where: { status: "OPEN" },
    include: bountyInclude,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getBounty(id: string) {
  const bounty = await prisma.bounty.findUnique({
    where: { id },
    include: bountyInclude,
  });
  if (!bounty) throw new NotFoundError("Bounty not found");
  return bounty;
}

export async function getBountyByOpportunitySlug(slug: string) {
  const bounty = await prisma.bounty.findFirst({
    where: { opportunity: { slug } },
    include: bountyInclude,
  });
  if (!bounty) return null;
  return bounty;
}

export async function createBounty(input: {
  userId: string;
  organizationId: string;
  title: string;
  description: string;
  rewardAmount: number;
  rewardCurrency: string;
  requiredSkills: string[];
  deadline?: string;
}) {
  await requireOrganizationManager(input.organizationId, input.userId);
  const slug = await generateOpportunitySlug(input.title);
  const currency = input.rewardCurrency.toUpperCase();

  return prisma.$transaction(async (tx) => {
    const organization = await tx.organization.findUnique({
      where: { id: input.organizationId },
      select: { id: true, name: true },
    });
    if (!organization) throw new NotFoundError("Organization not found");

    const opportunity = await tx.opportunity.create({
      data: {
        title: input.title,
        slug,
        organizationId: organization.id,
        organizationName: organization.name,
        category: "COMPETITIONS",
        opportunityType: "HACKATHON",
        description: input.description,
        summaryShort: input.description.slice(0, 240),
        valueMin: input.rewardAmount,
        valueMax: input.rewardAmount,
        currency,
        deadline: input.deadline ? new Date(input.deadline) : null,
        status: "PUBLISHED",
        systemState: "PUBLISHED",
        verificationStatus: "UNVERIFIED",
        extra: { listingKind: "SCOUT_BOUNTY" },
      },
    });

    return tx.bounty.create({
      data: {
        organizationId: organization.id,
        opportunityId: opportunity.id,
        createdByUserId: input.userId,
        rewardAmount: input.rewardAmount,
        rewardCurrency: currency,
        requiredSkills: input.requiredSkills,
      },
      include: bountyInclude,
    });
  });
}

export async function listManagedBounties(userId: string) {
  const memberships = await prisma.organizationMember.findMany({
    where: { userId, role: { in: ["OWNER", "ADMIN"] } },
    select: { organizationId: true },
  });
  const organizationIds = memberships.map((membership) => membership.organizationId);
  if (organizationIds.length === 0) return [];
  return prisma.bounty.findMany({
    where: { organizationId: { in: organizationIds } },
    include: {
      ...bountyInclude,
      submissions: {
        include: {
          participant: {
            select: { id: true, fullName: true, walletAddress: true },
          },
          achievement: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getMySubmission(bountyId: string, userId: string) {
  return prisma.opportunitySubmission.findUnique({
    where: { bountyId_userId: { bountyId, userId } },
    include: { achievement: true },
  });
}

export async function getSubmissionQueue(
  bountyId: string,
  userId: string,
) {
  const bounty = await getBounty(bountyId);
  await requireOrganizationManager(bounty.organizationId, userId);
  return prisma.opportunitySubmission.findMany({
    where: { bountyId },
    include: {
      participant: {
        select: { id: true, fullName: true, walletAddress: true },
      },
      achievement: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createActionTransaction(bountyId: string, account: string) {
  const bounty = await getBounty(bountyId);
  if (bounty.status !== "OPEN") throw new ConflictError("This bounty is not open");

  let wallet: PublicKey;
  try {
    wallet = new PublicKey(account);
  } catch {
    throw new ValidationError("A valid Solana account is required");
  }

  const memo = JSON.stringify({
    protocol: "scout",
    action: "bounty.participate",
    bountyId: bounty.id,
    opportunitySlug: bounty.opportunity.slug,
    network: "devnet",
  });
  const latest = await connection.getLatestBlockhash("confirmed");
  const transaction = new Transaction({
    feePayer: wallet,
    recentBlockhash: latest.blockhash,
  }).add(
    new TransactionInstruction({
      programId: MEMO_PROGRAM_ID,
      keys: [],
      data: Buffer.from(memo, "utf8"),
    }),
  );

  return {
    transaction: transaction
      .serialize({ requireAllSignatures: false, verifySignatures: false })
      .toString("base64"),
    message: `Record your participation in ${bounty.opportunity.title} on Solana Devnet. This signs a public memo and does not transfer tokens.`,
  };
}

export async function recordParticipation(input: {
  bountyId: string;
  userId: string;
  transactionSignature: string;
}) {
  const bounty = await getBounty(input.bountyId);
  if (bounty.status !== "OPEN") throw new ConflictError("This bounty is not open");

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { walletAddress: true },
  });
  if (!user?.walletAddress) {
    throw new ConflictError("Link and verify a Solana wallet before joining a bounty");
  }

  await verifyParticipationTransaction(
    input.transactionSignature,
    user.walletAddress,
    bounty.id,
    bounty.opportunity.slug,
  );

  const prior = await prisma.opportunitySubmission.findUnique({
    where: { bountyId_userId: { bountyId: bounty.id, userId: input.userId } },
  });
  if (prior?.status === "APPROVED") {
    throw new ConflictError("This participation already has a verified achievement");
  }

  return prisma.opportunitySubmission.upsert({
    where: { bountyId_userId: { bountyId: bounty.id, userId: input.userId } },
    create: {
      bountyId: bounty.id,
      userId: input.userId,
      walletAddress: user.walletAddress,
      participationTxSignature: input.transactionSignature,
      status: "PARTICIPATING",
    },
    update: {
      walletAddress: user.walletAddress,
      participationTxSignature: input.transactionSignature,
      submissionUrl: null,
      submissionText: null,
      status: "PARTICIPATING",
      reviewedByUserId: null,
      reviewedAt: null,
      reviewNote: null,
    },
  });
}

export async function submitWork(input: {
  bountyId: string;
  userId: string;
  submissionUrl?: string;
  submissionText?: string;
}) {
  const submission = await prisma.opportunitySubmission.findUnique({
    where: { bountyId_userId: { bountyId: input.bountyId, userId: input.userId } },
  });
  if (!submission || !submission.participationTxSignature) {
    throw new ConflictError("Record on-chain participation before submitting work");
  }
  if (submission.status === "APPROVED") {
    throw new ConflictError("This submission already has a verified achievement");
  }
  return prisma.opportunitySubmission.update({
    where: { id: submission.id },
    data: {
      submissionUrl: input.submissionUrl ?? null,
      submissionText: input.submissionText ?? null,
      status: "SUBMITTED",
      reviewedByUserId: null,
      reviewedAt: null,
      reviewNote: null,
    },
  });
}

export async function reviewSubmission(input: {
  bountyId: string;
  submissionId: string;
  userId: string;
  approved: boolean;
  reviewNote?: string;
}) {
  const bounty = await getBounty(input.bountyId);
  await requireOrganizationManager(bounty.organizationId, input.userId);
  const submission = await prisma.opportunitySubmission.findFirst({
    where: { id: input.submissionId, bountyId: input.bountyId },
    include: { participant: { select: { id: true } } },
  });
  if (!submission) throw new NotFoundError("Bounty submission not found");
  if (submission.status !== "SUBMITTED") {
    throw new ConflictError("Only submitted work can be reviewed");
  }

  const reviewedAt = new Date();
  if (!input.approved) {
    return prisma.opportunitySubmission.update({
      where: { id: submission.id },
      data: {
        status: "REJECTED",
        reviewedByUserId: input.userId,
        reviewedAt,
        reviewNote: input.reviewNote ?? null,
      },
    });
  }

  const proofHash = createHash("sha256")
    .update(JSON.stringify({
      protocol: "scout-achievement-v1",
      bountyId: bounty.id,
      opportunityId: bounty.opportunityId,
      participantUserId: submission.userId,
      walletAddress: submission.walletAddress,
      participationTxSignature: submission.participationTxSignature,
      issuerOrganizationId: bounty.organizationId,
      issuedAt: reviewedAt.toISOString(),
    }))
    .digest("hex");

  return prisma.$transaction(async (tx) => {
    const achievement = await tx.verifiedAchievement.create({
      data: {
        userId: submission.userId,
        issuerUserId: input.userId,
        organizationId: bounty.organizationId,
        opportunityId: bounty.opportunityId,
        submissionId: submission.id,
        title: `Completed: ${bounty.opportunity.title}`,
        description: input.reviewNote ?? "Work reviewed and approved by the organization.",
        proofHash,
        points: 25,
        issuedAt: reviewedAt,
      },
    });
    await tx.opportunitySubmission.update({
      where: { id: submission.id },
      data: {
        status: "APPROVED",
        reviewedByUserId: input.userId,
        reviewedAt,
        reviewNote: input.reviewNote ?? null,
      },
    });
    return achievement;
  });
}

export async function getPassport(userId: string) {
  const [user, achievements, submissions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { walletAddress: true, walletVerifiedAt: true },
    }),
    prisma.verifiedAchievement.findMany({
      where: { userId },
      include: {
        issuer: { select: { id: true, fullName: true } },
        organization: { select: { id: true, name: true, slug: true } },
        opportunity: { select: { id: true, title: true, slug: true } },
        submission: { select: { participationTxSignature: true, walletAddress: true } },
      },
      orderBy: { issuedAt: "desc" },
    }),
    prisma.opportunitySubmission.findMany({
      where: { userId },
      select: { id: true, status: true, participationTxSignature: true },
    }),
  ]);
  if (!user) throw new NotFoundError("User not found");
  return {
    walletAddress: user.walletAddress,
    walletVerifiedAt: user.walletVerifiedAt,
    reputationScore: achievements.reduce((sum, achievement) => sum + achievement.points, 0),
    verifiedAchievementCount: achievements.length,
    onChainParticipationCount: submissions.filter((submission) => submission.participationTxSignature).length,
    achievements,
  };
}

async function requireOrganizationManager(organizationId: string, userId: string) {
  const membership = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId } },
    select: { role: true },
  });
  if (!membership) throw new ForbiddenError("You are not a member of this organization");
  if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
    throw new ForbiddenError("Only organization owners and admins can manage bounties");
  }
}

async function verifyParticipationTransaction(
  signature: string,
  expectedWallet: string,
  bountyId: string,
  opportunitySlug: string,
) {
  let transaction;
  try {
    transaction = await connection.getParsedTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });
  } catch {
    throw new ValidationError("Could not verify this transaction on Solana Devnet");
  }
  if (!transaction || transaction.meta?.err) {
    throw new ValidationError("The participation transaction is not confirmed on Solana Devnet");
  }
  const payer = transaction.transaction.message.accountKeys[0];
  if (!payer?.signer || payer.pubkey.toBase58() !== expectedWallet) {
    throw new UnauthorizedError("The confirmed transaction was not signed by your linked wallet");
  }

  const expectedMemo = JSON.stringify({
    protocol: "scout",
    action: "bounty.participate",
    bountyId,
    opportunitySlug,
    network: "devnet",
  });
  const memoFound = transaction.transaction.message.instructions.some((instruction) => {
    if (instruction.programId.toBase58() !== MEMO_PROGRAM_ID.toBase58()) return false;
    return "parsed" in instruction && instruction.parsed === expectedMemo;
  });
  if (!memoFound) {
    throw new ValidationError("This transaction does not contain the expected Scout bounty action");
  }
}
