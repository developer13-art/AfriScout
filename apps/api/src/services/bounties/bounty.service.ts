import { createHash, randomUUID } from "node:crypto";
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { prisma } from "../../config/database";
import { logger } from "../../config/logger";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../../utils/errors";
import { generateOpportunitySlug } from "../opportunities/opportunity.service";
import { ensureMatchesForUser } from "../matching/batchMatch.service";

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
  const bounties = await prisma.bounty.findMany({
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
  return bounties.map((bounty) => ({
    ...bounty,
    submissions: bounty.submissions.map(hideUnsubmittedProof),
  }));
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
  const submissions = await prisma.opportunitySubmission.findMany({
    where: { bountyId },
    include: {
      participant: {
        select: { id: true, fullName: true, walletAddress: true },
      },
      achievement: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return submissions.map(hideUnsubmittedProof);
}

export async function createPayoutTransaction(
  bountyId: string,
  submissionId: string,
  userId: string,
  account: string,
) {
  const bounty = await getBounty(bountyId);
  await requireOrganizationManager(bounty.organizationId, userId);
  if (bounty.status !== "OPEN") throw new ConflictError("This bounty is not open");
  if (bounty.rewardCurrency !== "SOL") {
    throw new ConflictError("On-chain payouts currently support SOL-denominated bounties only");
  }

  let payer: PublicKey;
  try {
    payer = new PublicKey(account);
  } catch {
    throw new ValidationError("A valid Solana account is required");
  }
  if (payer.toBase58() !== account) {
    throw new ValidationError("Use the canonical Solana wallet address");
  }
  const reviewer = await prisma.user.findUnique({
    where: { id: userId },
    select: { walletAddress: true, walletVerifiedAt: true },
  });
  if (reviewer?.walletAddress !== account || !reviewer.walletVerifiedAt) {
    throw new UnauthorizedError("Link and verify this wallet before paying the bounty");
  }

  const submission = await prisma.opportunitySubmission.findFirst({
    where: { id: submissionId, bountyId, status: "SUBMITTED" },
    select: { walletAddress: true, rewardTxSignature: true },
  });
  if (!submission?.walletAddress) {
    throw new ConflictError("This submission has no verified recipient wallet");
  }
  if (submission.rewardTxSignature) {
    throw new ConflictError("A reward transaction has already been recorded");
  }

  const recipient = new PublicKey(submission.walletAddress);
  if (recipient.equals(payer)) {
    throw new ValidationError("The organization wallet cannot receive its own bounty payout");
  }
  const lamports = solToLamports(bounty.rewardAmount.toString());
  const now = new Date();
  const reservationExpiresBefore = new Date(now.getTime() - 30 * 60 * 1000);
  let reservation = bounty.payoutReservationId &&
      bounty.payoutSubmissionId === submissionId &&
      bounty.payoutReservedByUserId === userId &&
      bounty.payoutReservedAt &&
      bounty.payoutReservedAt > reservationExpiresBefore
    ? bounty.payoutReservationId
    : null;

  if (!reservation) {
    if (
      bounty.payoutReservationId &&
      bounty.payoutReservedAt &&
      bounty.payoutReservedAt > reservationExpiresBefore
    ) {
      throw new ConflictError("Another payout is already being prepared for this bounty");
    }
    reservation = randomUUID();
    const claimed = await prisma.bounty.updateMany({
      where: {
        id: bounty.id,
        status: "OPEN",
        payoutReservationId: bounty.payoutReservationId,
        payoutReservedAt: bounty.payoutReservedAt,
      },
      data: {
        payoutReservationId: reservation,
        payoutSubmissionId: submissionId,
        payoutReservedByUserId: userId,
        payoutReservedAt: now,
      },
    });
    if (claimed.count !== 1) {
      throw new ConflictError("Another organization manager is preparing a payout");
    }
  }

  const memo = JSON.stringify({
    protocol: "scout",
    action: "bounty.reward",
    bountyId: bounty.id,
    submissionId,
    reservationId: reservation,
    recipient: recipient.toBase58(),
    lamports: lamports.toString(),
    network: "devnet",
  });
  const latest = await connection.getLatestBlockhash("confirmed");
  const transaction = new Transaction({
    feePayer: payer,
    recentBlockhash: latest.blockhash,
  }).add(
    SystemProgram.transfer({
      fromPubkey: payer,
      toPubkey: recipient,
      lamports: Number(lamports),
    }),
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
    reservationId: reservation,
    message: `Pay ${bounty.rewardAmount.toString()} Devnet SOL to the verified contributor. This is a direct payment, not escrow.`,
  };
}

export async function createActionTransaction(bountyId: string, account: string) {
  const bounty = await getBounty(bountyId);
  if (bounty.status !== "OPEN") throw new ConflictError("This bounty is not open");

  const wallet = parseActionWallet(account);
  const user = await prisma.user.findUnique({
    where: { walletAddress: wallet.toBase58() },
    select: { walletVerifiedAt: true },
  });
  if (!user?.walletVerifiedAt) {
    throw new UnauthorizedError("Link and verify this wallet in Scout before joining");
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

export async function recordActionParticipation(input: {
  bountyId: string;
  account: string;
  transactionSignature: string;
}) {
  const wallet = parseActionWallet(input.account);
  const user = await prisma.user.findUnique({
    where: { walletAddress: wallet.toBase58() },
    select: { id: true, walletAddress: true, walletVerifiedAt: true },
  });
  if (!user?.walletAddress || !user.walletVerifiedAt) {
    throw new UnauthorizedError("Link and verify this wallet in Scout before joining");
  }
  return recordParticipation({
    bountyId: input.bountyId,
    userId: user.id,
    transactionSignature: input.transactionSignature,
  });
}

export async function createActionSubmissionTransaction(input: {
  bountyId: string;
  account: string;
  submissionUrl?: string;
  submissionText?: string;
}) {
  const bounty = await getBounty(input.bountyId);
  if (bounty.status !== "OPEN") throw new ConflictError("This bounty is not open");
  const wallet = parseActionWallet(input.account);
  const user = await prisma.user.findUnique({
    where: { walletAddress: wallet.toBase58() },
    select: { id: true, walletAddress: true, walletVerifiedAt: true },
  });
  if (!user?.walletAddress || !user.walletVerifiedAt) {
    throw new UnauthorizedError("Link and verify this wallet in Scout before submitting work");
  }

  const submissionUrl = input.submissionUrl?.trim() || null;
  const submissionText = input.submissionText?.trim() || null;
  if (submissionUrl) {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(submissionUrl);
    } catch {
      throw new ValidationError("The submission link must be a valid HTTPS URL");
    }
    if (parsedUrl.protocol !== "https:") {
      throw new ValidationError("The submission link must use HTTPS");
    }
  }
  if (!submissionUrl && !submissionText) {
    throw new ValidationError("Provide a link or describe the submitted work");
  }
  if (submissionText && submissionText.length < 20) {
    throw new ValidationError("The work description must be at least 20 characters");
  }

  const submission = await prisma.opportunitySubmission.findUnique({
    where: { bountyId_userId: { bountyId: bounty.id, userId: user.id } },
  });
  if (!submission?.participationTxSignature) {
    throw new ConflictError("Record on-chain participation before submitting work");
  }
  if (submission.status !== "PARTICIPATING" && submission.status !== "REJECTED") {
    throw new ConflictError("This submission is not accepting new work");
  }

  const proofHash = actionSubmissionHash({
    bountyId: bounty.id,
    submissionId: submission.id,
    walletAddress: wallet.toBase58(),
    submissionUrl,
    submissionText,
  });
  const staged = await prisma.opportunitySubmission.updateMany({
    where: {
      id: submission.id,
      status: { in: ["PARTICIPATING", "REJECTED"] },
    },
    data: {
      submissionUrl,
      submissionText,
      submissionProofTxSignature: null,
      submissionDraftHash: proofHash,
    },
  });
  if (staged.count !== 1) {
    throw new ConflictError("This submission changed while preparing the proof transaction");
  }

  const memo = JSON.stringify({
    protocol: "scout",
    action: "bounty.submit-proof",
    bountyId: bounty.id,
    submissionId: submission.id,
    proofHash,
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
    message: "Submit this work by signing a Devnet transaction containing its SHA-256 fingerprint. Your work link and description are not written on-chain.",
  };
}

export async function confirmActionSubmission(input: {
  bountyId: string;
  account: string;
  transactionSignature: string;
}) {
  const wallet = parseActionWallet(input.account);
  const user = await prisma.user.findUnique({
    where: { walletAddress: wallet.toBase58() },
    select: { id: true, walletAddress: true, walletVerifiedAt: true },
  });
  if (!user?.walletAddress || !user.walletVerifiedAt) {
    throw new UnauthorizedError("This transaction must use a verified Scout wallet");
  }
  const bounty = await getBounty(input.bountyId);
  const submission = await prisma.opportunitySubmission.findUnique({
    where: { bountyId_userId: { bountyId: bounty.id, userId: user.id } },
  });
  if (!submission?.participationTxSignature) {
    throw new ConflictError("Record on-chain participation before submitting work");
  }
  if (
    submission.status === "SUBMITTED" &&
    submission.submissionProofTxSignature === input.transactionSignature
  ) {
    return submission;
  }
  if (submission.status !== "PARTICIPATING" && submission.status !== "REJECTED") {
    throw new ConflictError("This submission is not awaiting a proof transaction");
  }
  if (!submission.submissionUrl && !submission.submissionText) {
    throw new ConflictError("No staged work was found for this proof transaction");
  }

  const proofHash = actionSubmissionHash({
    bountyId: bounty.id,
    submissionId: submission.id,
    walletAddress: wallet.toBase58(),
    submissionUrl: submission.submissionUrl,
    submissionText: submission.submissionText,
  });
  if (submission.submissionDraftHash !== proofHash) {
    throw new ConflictError("The proof details changed after this transaction was prepared");
  }
  const expectedMemo = JSON.stringify({
    protocol: "scout",
    action: "bounty.submit-proof",
    bountyId: bounty.id,
    submissionId: submission.id,
    proofHash,
    network: "devnet",
  });
  await verifyMemoTransaction(
    input.transactionSignature,
    wallet.toBase58(),
    expectedMemo,
    "This transaction does not contain the expected Scout proof fingerprint",
  );

  const updated = await prisma.opportunitySubmission.updateMany({
    where: {
      id: submission.id,
      status: { in: ["PARTICIPATING", "REJECTED"] },
      submissionProofTxSignature: null,
      submissionDraftHash: proofHash,
    },
    data: {
      submissionProofTxSignature: input.transactionSignature,
      submissionDraftHash: null,
      status: "SUBMITTED",
      reviewedByUserId: null,
      reviewedAt: null,
      reviewNote: null,
    },
  });
  if (updated.count !== 1) {
    throw new ConflictError("This proof has already been recorded or reviewed");
  }
  const confirmed = await prisma.opportunitySubmission.findUniqueOrThrow({
    where: { id: submission.id },
  });
  scheduleMatchRefresh(user.id);
  return confirmed;
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
    select: { walletAddress: true, walletVerifiedAt: true },
  });
  if (!user?.walletAddress || !user.walletVerifiedAt) {
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

  const recorded = await prisma.opportunitySubmission.upsert({
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
      submissionProofTxSignature: null,
      submissionDraftHash: null,
      submissionUrl: null,
      submissionText: null,
      status: "PARTICIPATING",
      reviewedByUserId: null,
      reviewedAt: null,
      reviewNote: null,
    },
  });
  scheduleMatchRefresh(input.userId);
  return recorded;
}

export async function submitWork(input: {
  bountyId: string;
  userId: string;
  submissionUrl?: string;
  submissionText?: string;
  transactionSignature: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { walletAddress: true, walletVerifiedAt: true },
  });
  if (!user?.walletAddress || !user.walletVerifiedAt) {
    throw new UnauthorizedError("Link and verify a wallet before submitting work");
  }
  const submission = await prisma.opportunitySubmission.findUnique({
    where: { bountyId_userId: { bountyId: input.bountyId, userId: input.userId } },
  });
  if (!submission || !submission.participationTxSignature) {
    throw new ConflictError("Record on-chain participation before submitting work");
  }
  if (submission.status === "APPROVED") {
    throw new ConflictError("This submission already has a verified achievement");
  }
  if (
    submission.submissionUrl !== (input.submissionUrl ?? null) ||
    submission.submissionText !== (input.submissionText ?? null)
  ) {
    throw new ConflictError("Prepare and sign a proof fingerprint before submitting work");
  }
  return confirmActionSubmission({
    bountyId: input.bountyId,
    account: user.walletAddress,
    transactionSignature: input.transactionSignature,
  });
}

export async function reviewSubmission(input: {
  bountyId: string;
  submissionId: string;
  userId: string;
  approved: boolean;
  reviewNote?: string;
  rewardTxSignature?: string;
}) {
  const bounty = await getBounty(input.bountyId);
  await requireOrganizationManager(bounty.organizationId, input.userId);
  if (bounty.status !== "OPEN") throw new ConflictError("This bounty has already been awarded or closed");
  const submission = await prisma.opportunitySubmission.findFirst({
    where: { id: input.submissionId, bountyId: input.bountyId },
    include: { participant: { select: { id: true } } },
  });
  if (!submission) throw new NotFoundError("Bounty submission not found");
  if (submission.status !== "SUBMITTED") {
    throw new ConflictError("Only submitted work can be reviewed");
  }
  if (
    !input.approved &&
    bounty.payoutSubmissionId === submission.id &&
    bounty.payoutReservedAt &&
    bounty.payoutReservedAt > new Date(Date.now() - 30 * 60 * 1000)
  ) {
    throw new ConflictError("Finish or retry the reserved payout before declining this submission");
  }
  if (input.approved && bounty.rewardCurrency === "SOL") {
    if (!input.rewardTxSignature) {
      throw new ValidationError("Pay the verified contributor on Devnet before approving this SOL bounty");
    }
    const reviewer = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { walletAddress: true, walletVerifiedAt: true },
    });
    if (!reviewer?.walletAddress || !reviewer.walletVerifiedAt) {
      throw new UnauthorizedError("Link and verify the organization wallet before approving this payout");
    }
    const reservationExpiresBefore = new Date(Date.now() - 30 * 60 * 1000);
    if (
      !bounty.payoutReservationId ||
      bounty.payoutSubmissionId !== submission.id ||
      bounty.payoutReservedByUserId !== input.userId ||
      !bounty.payoutReservedAt ||
      bounty.payoutReservedAt <= reservationExpiresBefore
    ) {
      throw new ConflictError("Request a fresh payout transaction before approving this work");
    }
    await verifyRewardTransaction(
      input.rewardTxSignature,
      reviewer.walletAddress,
      submission.walletAddress,
      bounty.id,
      submission.id,
      solToLamports(bounty.rewardAmount.toString()),
      bounty.payoutReservationId,
    );
  } else if (input.rewardTxSignature) {
    throw new ValidationError("A payout transaction can only be used when approving a submission");
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
      rewardTxSignature: input.rewardTxSignature ?? null,
      issuerOrganizationId: bounty.organizationId,
      issuedAt: reviewedAt.toISOString(),
    }))
    .digest("hex");

  const achievement = await prisma.$transaction(async (tx) => {
    const awarded = await tx.bounty.updateMany({
      where: {
        id: bounty.id,
        status: "OPEN",
        payoutReservationId: bounty.payoutReservationId,
      },
      data: {
        status: "COMPLETED",
        payoutReservationId: null,
        payoutSubmissionId: null,
        payoutReservedByUserId: null,
        payoutReservedAt: null,
      },
    });
    if (awarded.count !== 1) {
      throw new ConflictError("Another submission has already been awarded");
    }
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
        rewardTxSignature: input.rewardTxSignature ?? null,
        reviewedByUserId: input.userId,
        reviewedAt,
        reviewNote: input.reviewNote ?? null,
      },
    });
    return achievement;
  });
  scheduleMatchRefresh(submission.userId);
  return achievement;
}

export async function getPassport(userId: string) {
  const [user, achievements, submissions, professionalProfile] = await Promise.all([
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
        submission: {
          select: {
            participationTxSignature: true,
            submissionProofTxSignature: true,
            rewardTxSignature: true,
            walletAddress: true,
          },
        },
      },
      orderBy: { issuedAt: "desc" },
    }),
    prisma.opportunitySubmission.findMany({
      where: { userId },
      select: {
        id: true,
        status: true,
        participationTxSignature: true,
        submissionProofTxSignature: true,
        rewardTxSignature: true,
      },
    }),
    prisma.professionalProfile.findUnique({
      where: { userId },
      select: { skills: true, certifications: true },
    }),
  ]);
  if (!user) throw new NotFoundError("User not found");
  return {
    walletAddress: user.walletAddress,
    walletVerifiedAt: user.walletVerifiedAt,
    reputationScore: achievements.reduce((sum, achievement) => sum + achievement.points, 0),
    verifiedAchievementCount: achievements.length,
    anchoredAchievementCount: achievements.filter((achievement) => achievement.proofTxSignature).length,
    onChainParticipationCount: submissions.filter((submission) => submission.participationTxSignature).length,
    onChainSubmissionCount: submissions.filter((submission) => submission.submissionProofTxSignature).length,
    completedOpportunityCount: submissions.filter((submission) => submission.status === "APPROVED").length,
    paidRewardCount: submissions.filter((submission) => submission.rewardTxSignature).length,
    skills: professionalProfile?.skills ?? [],
    certifications: professionalProfile?.certifications ?? [],
    achievements,
  };
}

function parseActionWallet(account: string): PublicKey {
  let wallet: PublicKey;
  try {
    wallet = new PublicKey(account);
  } catch {
    throw new ValidationError("A valid Solana account is required");
  }
  if (wallet.toBase58() !== account) {
    throw new ValidationError("Use the canonical Solana wallet address");
  }
  return wallet;
}

function actionSubmissionHash(input: {
  bountyId: string;
  submissionId: string;
  walletAddress: string;
  submissionUrl: string | null;
  submissionText: string | null;
}) {
  return createHash("sha256")
    .update(JSON.stringify({ protocol: "scout-proof-v1", ...input }))
    .digest("hex");
}

async function verifyMemoTransaction(
  signature: string,
  expectedWallet: string,
  expectedMemo: string,
  mismatchMessage: string,
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
    throw new ValidationError("The transaction is not confirmed on Solana Devnet");
  }
  const payer = transaction.transaction.message.accountKeys[0];
  if (!payer?.signer || payer.pubkey.toBase58() !== expectedWallet) {
    throw new UnauthorizedError("The confirmed transaction was not signed by your linked wallet");
  }
  const memoFound = transaction.transaction.message.instructions.some((instruction) =>
    instruction.programId.toBase58() === MEMO_PROGRAM_ID.toBase58() &&
    "parsed" in instruction &&
    instruction.parsed === expectedMemo,
  );
  if (!memoFound) throw new ValidationError(mismatchMessage);
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

function hideUnsubmittedProof<T extends {
  submissionDraftHash: string | null;
  submissionUrl: string | null;
  submissionText: string | null;
}>(submission: T): T {
  if (!submission.submissionDraftHash) return submission;
  return {
    ...submission,
    submissionUrl: null,
    submissionText: null,
    submissionDraftHash: null,
  };
}

function scheduleMatchRefresh(userId: string) {
  void ensureMatchesForUser(userId).catch((error) => {
    logger.warn({ err: error, userId }, "match_refresh_after_reputation_change_failed");
  });
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

function solToLamports(amount: string): bigint {
  const match = /^(\d+)(?:\.(\d+))?$/.exec(amount);
  if (!match || (match[2]?.length ?? 0) > 9) {
    throw new ValidationError("SOL reward must have at most 9 decimal places");
  }
  const lamports =
    BigInt(match[1]) * 1_000_000_000n +
    BigInt((match[2] ?? "").padEnd(9, "0") || "0");
  if (lamports <= 0n || lamports > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new ValidationError("SOL reward is outside the supported payout range");
  }
  return lamports;
}

async function verifyRewardTransaction(
  signature: string,
  expectedPayer: string,
  expectedRecipient: string | null,
  bountyId: string,
  submissionId: string,
  expectedLamports: bigint,
  reservationId: string,
) {
  if (!expectedRecipient) {
    throw new ConflictError("The contributor must link a verified wallet before payout");
  }
  let transaction;
  try {
    transaction = await connection.getParsedTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });
  } catch {
    throw new ValidationError("Could not verify this payout transaction on Solana Devnet");
  }
  if (!transaction || transaction.meta?.err) {
    throw new ValidationError("The payout transaction is not confirmed on Solana Devnet");
  }
  const payer = transaction.transaction.message.accountKeys[0];
  if (!payer?.signer || payer.pubkey.toBase58() !== expectedPayer) {
    throw new UnauthorizedError("The payout was not signed by the linked organization wallet");
  }

  const transferFound = transaction.transaction.message.instructions.some((instruction) => {
    if (instruction.programId.toBase58() !== SystemProgram.programId.toBase58()) return false;
    if (!("parsed" in instruction) || !instruction.parsed || typeof instruction.parsed !== "object") {
      return false;
    }
    const parsed = instruction.parsed as {
      type?: string;
      info?: { source?: string; destination?: string; lamports?: number | string };
    };
    return (
      parsed.type === "transfer" &&
      parsed.info?.source === expectedPayer &&
      parsed.info.destination === expectedRecipient &&
      BigInt(parsed.info.lamports ?? 0) === expectedLamports
    );
  });
  const expectedMemo = JSON.stringify({
    protocol: "scout",
    action: "bounty.reward",
    bountyId,
    submissionId,
    reservationId,
    recipient: expectedRecipient,
    lamports: expectedLamports.toString(),
    network: "devnet",
  });
  const memoFound = transaction.transaction.message.instructions.some((instruction) =>
    instruction.programId.toBase58() === MEMO_PROGRAM_ID.toBase58() &&
    "parsed" in instruction &&
    instruction.parsed === expectedMemo,
  );
  if (!transferFound || !memoFound) {
    throw new ValidationError("This transaction does not contain the exact Scout bounty payout");
  }
}
