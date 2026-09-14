import { prisma } from "../../config/database";
import { hashToken } from "./session.hash";
import { env } from "../../config/env";
import { expiresInMs } from "./token.service";

export interface CreateSessionInput {
  userId: string;
  refreshToken: string;
  userAgent?: string | null;
  ipAddress?: string | null;
}

export async function createSession(input: CreateSessionInput) {
  const refreshTokenHash = hashToken(input.refreshToken);
  const expiresAt = new Date(Date.now() + expiresInMs(env.JWT_REFRESH_EXPIRES_IN));

  return prisma.session.create({
    data: {
      userId: input.userId,
      refreshTokenHash,
      userAgent: input.userAgent ?? null,
      ipAddress: input.ipAddress ?? null,
      expiresAt,
    },
    select: { id: true, userId: true, expiresAt: true },
  });
}

export async function findSessionByRefreshToken(refreshToken: string) {
  const refreshTokenHash = hashToken(refreshToken);
  return prisma.session.findFirst({
    where: { refreshTokenHash, revokedAt: null },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      revokedAt: true,
    },
  });
}

export async function revokeSession(sessionId: string): Promise<void> {
  await prisma.session.update({
    where: { id: sessionId },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function pruneExpiredSessions(): Promise<number> {
  const result = await prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return result.count;
}