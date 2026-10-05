import {
  createPublicKey,
  randomBytes,
  verify as verifySignature,
} from "node:crypto";
import { PublicKey } from "@solana/web3.js";
import { prisma } from "../../config/database";
import { env } from "../../config/env";
import { ConflictError, UnauthorizedError, ValidationError } from "../../utils/errors";
import { issueWalletTokens, type AuthResult, type RequestContext } from "./auth.service";

const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

function validateWalletAddress(address: string): Uint8Array {
  try {
    const key = new PublicKey(address);
    if (key.toBase58() !== address) throw new Error("Non-canonical address");
    return key.toBytes();
  } catch {
    throw new ValidationError("Enter a valid Solana wallet address");
  }
}

export async function createChallenge(walletAddress: string, userId?: string) {
  validateWalletAddress(walletAddress);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);
  const nonce = randomBytes(24).toString("base64url");
  const purpose = userId ? "LINK" : "LOGIN";
  const message = [
    `${env.APP_NAME} wallet verification`,
    `Action: ${purpose === "LINK" ? "link wallet to Scout account" : "sign in to Scout"}`,
    `Wallet: ${walletAddress}`,
    `Nonce: ${nonce}`,
    `Issued At: ${now.toISOString()}`,
    `Expires At: ${expiresAt.toISOString()}`,
    "This signature does not authorize a transfer.",
  ].join("\n");

  await prisma.walletChallenge.create({
    data: { walletAddress, userId: userId ?? null, purpose, nonce, message, expiresAt },
  });

  return { walletAddress, nonce, message, expiresAt: expiresAt.toISOString() };
}

function verifyWalletSignature(
  walletAddress: string,
  message: string,
  signatureBase64: string,
): boolean {
  const publicKeyBytes = validateWalletAddress(walletAddress);
  const signature = Buffer.from(signatureBase64, "base64");
  if (signature.length !== 64) return false;

  try {
    const publicKey = createPublicKey({
      key: Buffer.concat([ED25519_SPKI_PREFIX, Buffer.from(publicKeyBytes)]),
      format: "der",
      type: "spki",
    });
    return verifySignature(null, Buffer.from(message, "utf8"), publicKey, signature);
  } catch {
    return false;
  }
}

export async function verifyChallenge(input: {
  walletAddress: string;
  nonce: string;
  signature: string;
  fullName?: string;
  currentUserId?: string;
}, ctx: RequestContext): Promise<
  | { purpose: "LOGIN"; auth: AuthResult }
  | { purpose: "LINK"; user: { id: string; walletAddress: string; walletVerifiedAt: Date } }
> {
  validateWalletAddress(input.walletAddress);
  const challenge = await prisma.walletChallenge.findUnique({
    where: { nonce: input.nonce },
  });
  if (
    !challenge ||
    challenge.walletAddress !== input.walletAddress ||
    challenge.consumedAt ||
    challenge.expiresAt.getTime() <= Date.now()
  ) {
    throw new UnauthorizedError("Wallet challenge is expired or has already been used");
  }
  if (!verifyWalletSignature(input.walletAddress, challenge.message, input.signature)) {
    throw new UnauthorizedError("Wallet signature could not be verified");
  }

  if (challenge.purpose === "LINK") {
    if (!input.currentUserId || challenge.userId !== input.currentUserId) {
      throw new UnauthorizedError("Sign in to the account that requested this wallet link");
    }
    const user = await prisma.$transaction(async (tx) => {
      const consumed = await tx.walletChallenge.updateMany({
        where: {
          id: challenge.id,
          userId: input.currentUserId,
          consumedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { consumedAt: new Date() },
      });
      if (consumed.count !== 1) {
        throw new ConflictError("Wallet challenge has already been used");
      }

      const otherAccount = await tx.user.findUnique({
        where: { walletAddress: input.walletAddress },
        select: { id: true },
      });
      if (otherAccount && otherAccount.id !== input.currentUserId) {
        throw new ConflictError("This wallet is already linked to another Scout account");
      }

      return tx.user.update({
        where: { id: input.currentUserId },
        data: { walletAddress: input.walletAddress, walletVerifiedAt: new Date() },
        select: { id: true, walletAddress: true, walletVerifiedAt: true },
      });
    });
    if (!user.walletAddress || !user.walletVerifiedAt) {
      throw new ConflictError("Wallet link could not be saved");
    }
    return {
      purpose: "LINK",
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        walletVerifiedAt: user.walletVerifiedAt,
      },
    };
  }

  const user = await prisma.$transaction(async (tx) => {
    const consumed = await tx.walletChallenge.updateMany({
      where: {
        id: challenge.id,
        userId: null,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { consumedAt: new Date() },
    });
    if (consumed.count !== 1) {
      throw new ConflictError("Wallet challenge has already been used");
    }

    const existing = await tx.user.findUnique({
      where: { walletAddress: input.walletAddress },
      select: { id: true },
    });
    if (existing) {
      return tx.user.update({
        where: { id: existing.id },
        data: { walletVerifiedAt: new Date(), lastLoginAt: new Date(), failedLoginCount: 0 },
        select: { id: true },
      });
    }
    return tx.user.create({
      data: {
        walletAddress: input.walletAddress,
        walletVerifiedAt: new Date(),
        fullName: input.fullName?.trim() || "Scout member",
        role: "USER",
        status: "ACTIVE",
        lastLoginAt: new Date(),
      },
      select: { id: true },
    });
  });

  return {
    purpose: "LOGIN",
    auth: await issueWalletTokens(user.id, ctx),
  };
}
