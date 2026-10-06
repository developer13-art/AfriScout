import { PublicKey } from "@solana/web3.js";
import { prisma } from "../../config/database";
import { NotFoundError, UnauthorizedError, ValidationError } from "../../utils/errors";
import {
  createMemoTransaction,
  verifyMemoReceipt,
} from "../solana/solanaReceipt.service";

function parseWallet(address: string) {
  let wallet: PublicKey;
  try {
    wallet = new PublicKey(address);
  } catch {
    throw new ValidationError("A valid Solana wallet address is required");
  }
  if (wallet.toBase58() !== address) {
    throw new ValidationError("Use the canonical Solana wallet address");
  }
  return wallet.toBase58();
}

async function requireOpportunity(opportunityId: string) {
  const opportunity = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      applicationUrl: true,
      bounty: { select: { id: true, status: true } },
    },
  });
  if (!opportunity) throw new NotFoundError("Opportunity not found");
  return opportunity;
}

async function requireVerifiedWallet(address: string) {
  const walletAddress = parseWallet(address);
  const user = await prisma.user.findUnique({
    where: { walletAddress },
    select: { id: true, walletAddress: true, walletVerifiedAt: true },
  });
  if (!user?.walletAddress || !user.walletVerifiedAt) {
    throw new UnauthorizedError("Link and verify this wallet in Scout before saving");
  }
  return user;
}

function saveMemo(opportunityId: string, walletAddress: string) {
  return JSON.stringify({
    protocol: "scout-opportunity-action-v1",
    action: "opportunity.save",
    opportunityId,
    walletAddress,
    network: "devnet",
  });
}

export async function getOpportunityAction(opportunityId: string) {
  return requireOpportunity(opportunityId);
}

export async function createSaveTransaction(
  opportunityId: string,
  account: string,
) {
  await requireOpportunity(opportunityId);
  const user = await requireVerifiedWallet(account);
  return {
    transaction: await createMemoTransaction(
      user.walletAddress,
      saveMemo(opportunityId, user.walletAddress),
    ),
    message:
      "Save this opportunity to your Scout account. Your linked wallet signs a Devnet receipt and pays only the network fee; no tokens are transferred.",
  };
}

export async function confirmSave(
  opportunityId: string,
  account: string,
  signature: string,
) {
  const [opportunity, user] = await Promise.all([
    requireOpportunity(opportunityId),
    requireVerifiedWallet(account),
  ]);
  await verifyMemoReceipt(
    signature,
    user.walletAddress,
    saveMemo(opportunity.id, user.walletAddress),
  );
  return prisma.savedOpportunity.upsert({
    where: {
      userId_opportunityId: {
        userId: user.id,
        opportunityId: opportunity.id,
      },
    },
    create: { userId: user.id, opportunityId: opportunity.id },
    update: {},
    select: { id: true, opportunityId: true, createdAt: true },
  });
}
