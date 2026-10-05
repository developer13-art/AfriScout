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
    email: string | null;
    walletAddress?: string | null;
    fullName: string;
    role: RoleKey;
    onboardingCompleted: boolean;
    workspaceIntent: "PERSONAL" | "ORGANIZATION" | "DEVELOPER" | null;
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
      workspaces: { create: { type: "PERSONAL", name: "Personal" } },
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

  const ok = user.passwordHash
    ? await verifyPassword(input.password, user.passwordHash)
    : false;
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
  user: { id: string; email: string | null; fullName: string; role: RoleKey },
  ctx: RequestContext,
): Promise<AuthResult> {
  const [profile, activeDna] = await Promise.all([
    prisma.userProfile.findUnique({
      where: { userId: user.id },
      select: { onboardingCompleted: true, workspaceIntent: true },
    }),
    prisma.dnaProfile.findFirst({
      where: { userId: user.id, isActive: true },
      select: { id: true },
    }),
  ]);
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

  const { hashToken } = await import("./session.hash.js");
  await prisma.session.update({
    where: { id: session.id },
    data: { refreshTokenHash: hashToken(refreshToken) },
  });

  logger.debug({ userId: user.id }, "auth_tokens_issued");

  return {
    user: {
      ...user,
      onboardingCompleted: Boolean(profile?.onboardingCompleted || activeDna),
      workspaceIntent: profile?.workspaceIntent ?? null,
    },
    accessToken,
    refreshToken,
  };
}

export async function issueWalletTokens(
  userId: string,
  ctx: RequestContext,
): Promise<AuthResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, walletAddress: true, fullName: true, role: true },
  });
  if (!user) throw new NotFoundError("Wallet identity not found");
  return issueTokens({ ...user, role: user.role as RoleKey }, ctx);
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      walletAddress: true,
      walletVerifiedAt: true,
      fullName: true,
      phone: true,
      city: true,
      countryCode: true,
      avatarUrl: true,
      role: true,
      status: true,
      emailVerifiedAt: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      profile: {
        select: {
          onboardingCompleted: true,
          workspaceIntent: true,
        },
      },
      dnaProfiles: {
        where: { isActive: true },
        take: 1,
        select: { id: true },
      },
    },
  });
  if (!user) throw new NotFoundError("User not found");
  const { profile, dnaProfiles, ...identity } = user;
  return {
    ...identity,
    onboardingCompleted: Boolean(profile?.onboardingCompleted || dnaProfiles.length),
    workspaceIntent: profile?.workspaceIntent ?? null,
  };
}