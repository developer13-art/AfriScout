import { prisma } from "../../config/database";
import { generateRandomString } from "../../utils/crypto";
import { hashApiKey } from "./apiKeyHash.service";
import { env } from "../../config/env";
import type { ApiKeyCreateInput } from "../../types/apiKey";

const KEY_PREFIX = "afs";
const PREFIX_LENGTH = 10;

export async function listApiKeys(userId: string) {
  return prisma.apiKey.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createApiKey(input: ApiKeyCreateInput) {
  const secret = generateRandomString(32);
  const prefix = `${KEY_PREFIX}_${secret.slice(0, PREFIX_LENGTH)}`;
  const plainTextKey = `${prefix}_${secret}`;
  const keyHash = hashApiKey(plainTextKey);

  const record = await prisma.apiKey.create({
    data: {
      userId: input.userId,
      name: input.name,
      prefix,
      keyHash,
      scopes: input.scopes,
      rateLimitPerMin: env.PLAN_FREE_RPM,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    },
  });

  return { apiKey: record, plainTextKey };
}

export async function revokeApiKey(userId: string, id: string) {
  return prisma.apiKey.updateMany({
    where: { id, userId },
    data: { revokedAt: new Date() },
  });
}

export async function requireApiKeyOwnership(userId: string, id: string) {
  const key = await prisma.apiKey.findFirst({ where: { id, userId } });
  if (!key) throw new Error("API key not found");
  return key;
}