import { prisma } from "../../config/database";
import { ConflictError, NotFoundError, UnauthorizedError } from "../../utils/errors";
import {
  createMemoTransaction,
  verifyMemoReceipt,
} from "../solana/solanaReceipt.service";

function achievementMemo(
  achievementId: string,
  proofHash: string,
  walletAddress: string,
) {
  return JSON.stringify({
    protocol: "scout-achievement-v1",
    action: "achievement.anchor",
    achievementId,
    proofHash,
    recipient: walletAddress,
    network: "devnet",
  });
}

export async function createAchievementProofTransaction(
  achievementId: string,
  userId: string,
  walletAddress: string,
) {
  const [achievement, user] = await Promise.all([
    prisma.verifiedAchievement.findFirst({
      where: { id: achievementId, userId },
      select: { id: true, proofHash: true, proofTxSignature: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { walletAddress: true, walletVerifiedAt: true },
    }),
  ]);
  if (!achievement) throw new NotFoundError("Verified achievement not found");
  if (user?.walletAddress !== walletAddress || !user.walletVerifiedAt) {
    throw new UnauthorizedError("Connect and verify the wallet linked to your Scout account");
  }
  if (achievement.proofTxSignature) {
    throw new ConflictError("This achievement already has a Devnet proof receipt");
  }
  return {
    transaction: await createMemoTransaction(
      walletAddress,
      achievementMemo(achievement.id, achievement.proofHash, walletAddress),
    ),
  };
}

export async function recordAchievementProof(
  achievementId: string,
  userId: string,
  signature: string,
) {
  const [achievement, user] = await Promise.all([
    prisma.verifiedAchievement.findFirst({
      where: { id: achievementId, userId },
      select: { id: true, proofHash: true, proofTxSignature: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { walletAddress: true, walletVerifiedAt: true },
    }),
  ]);
  if (!achievement) throw new NotFoundError("Verified achievement not found");
  if (!user?.walletAddress || !user.walletVerifiedAt) {
    throw new UnauthorizedError("Connect and verify a Solana wallet before anchoring this achievement");
  }
  if (achievement.proofTxSignature) {
    throw new ConflictError("This achievement already has a Devnet proof receipt");
  }
  await verifyMemoReceipt(
    signature,
    user.walletAddress,
    achievementMemo(achievement.id, achievement.proofHash, user.walletAddress),
  );
  const saved = await prisma.verifiedAchievement.updateMany({
    where: { id: achievement.id, userId, proofTxSignature: null },
    data: {
      proofTxSignature: signature,
      proofWalletAddress: user.walletAddress,
      proofAnchoredAt: new Date(),
    },
  });
  if (saved.count !== 1) throw new ConflictError("This achievement has already been anchored");
  return prisma.verifiedAchievement.findUniqueOrThrow({ where: { id: achievement.id } });
}
