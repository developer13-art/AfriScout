import { prisma } from "../../config/database";
import { env } from "../../config/env";
import {
  hashPassword,
  verifyPassword,
} from "./password.service";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "./token.service";
import {
  createSession,
  findSessionByRefreshToken,
  revokeAllUserSessions,
  revokeSession,
} from "./session.service";
import type { RoleKey } from "../../constants/roles";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../../utils/errors";
import { logger } from "../../config/logger";

export interface AuthResult {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: RoleKey;
  };
  accessToken: string;
  refreshToken: string;
}

export interface RequestContext {
  userAgent?: string | null;
  ipAddress?: string | null;
}

export async function register(input: {
  email: string;
  password: string;
  fullName: string;
  countryCode?: string;
}, ctx: RequestContext): Promise<AuthResult> {
  const email = input.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ConflictError("An account with this email already exists");
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName: input.fullName,
      countryCode: input.countryCode ?? null,
      role: "USER",
      status: "ACTIVE",
    },
    select: { id: true, email: true, fullName: true, role: true },
  });

  return issueTokens(user, ctx);
}

export async function login(input: {
  email: string;
  password: string;
}, ctx: RequestContext): Promise<AuthResult> {
  const email = input.email.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      passwordHash: true,
      status: true,
      failedLoginCount: true,
      lockedUntil: true,
    },
  });

  if (!user) {
    throw new UnauthorizedError("Invalid email or password");
  }
  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    throw new UnauthorizedError("Account is temporarily locked");
  }
  if (user.status !== "ACTIVE") {
    throw new UnauthorizedError("Account is not active");
  }

  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) {
    const failed = user.failedLoginCount + 1;
    const lockedUntil = failed >= 8 ? new Date(Date.now() + 15 * 60 * 1000) : null;
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: failed, lockedUntil },
    });
    throw new UnauthorizedError("Invalid email or password");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
  });

  return issueTokens(
    { id: user.id, email: user.email, fullName: user.fullName, role: user.role as RoleKey },
    ctx,
  );
}

export async function refresh(input: {
  refreshToken: string;
}, ctx: RequestContext): Promise<AuthResult> {
  const payload = verifyRefreshToken(input.refreshToken);
  const session = await findSessionByRefreshToken(input.refreshToken);
  if (!session || session.revokedAt) {
    throw new UnauthorizedError("Refresh token has been revoked");
  }
  if (session.expiresAt.getTime() < Date.now()) {
    await revokeSession(session.id);
    throw new UnauthorizedError("Refresh token has expired");
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, fullName: true, role: true, status: true },
  });
  if (!user || user.status !== "ACTIVE") {
    throw new UnauthorizedError("Account is not active");
  }

  await revokeSession(session.id);

  return issueTokens(
    { id: user.id, email: user.email, fullName: user.fullName, role: user.role as RoleKey },
    ctx,
  );
}

export async function logout(refreshToken: string): Promise<void> {
  const session = await findSessionByRefreshToken(refreshToken);
  if (session) await revokeSession(session.id);
}

export async function logoutAll(userId: string): Promise<void> {
  await revokeAllUserSessions(userId);
}

async function issueTokens(
  user: { id: string; email: string; fullName: string; role: RoleKey },
  ctx: RequestContext,
): Promise<AuthResult> {
  const accessToken = signAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      refreshTokenHash: "pending",
      userAgent: ctx.userAgent ?? null,
      ipAddress: ctx.ipAddress ?? null,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    },
    select: { id: true },
  });

  const refreshToken = signRefreshToken({ userId: user.id, sessionId: session.id });

  const { hashToken } = await import("./session.hash");
  await prisma.session.update({
    where: { id: session.id },
    data: { refreshTokenHash: hashToken(refreshToken) },
  });

  logger.debug({ userId: user.id }, "auth_tokens_issued");

  return { user, accessToken, refreshToken };
}