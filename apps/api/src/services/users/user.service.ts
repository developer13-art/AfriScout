import { prisma } from "../../config/database";
import { ConflictError, NotFoundError } from "../../utils/errors";
import type { RoleKey } from "../../constants/roles";
import type { UpdateMeInput, UpdateProfileInput } from "../../validators/user.validator";

export async function findUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
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
  if (!user) return null;
  const { profile, dnaProfiles, ...identity } = user;
  return {
    ...identity,
    onboardingCompleted: Boolean(profile?.onboardingCompleted || dnaProfiles.length),
    workspaceIntent: profile?.workspaceIntent ?? null,
  };
}

export async function requireUserById(id: string) {
  const user = await findUserById(id);
  if (!user) throw new NotFoundError("User not found");
  return user;
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
}

export async function listUsers(input: {
  page: number;
  pageSize: number;
  q?: string;
  role?: RoleKey;
  status?: string;
}) {
  const where: Record<string, unknown> = {};
  if (input.q) {
    where.OR = [
      { email: { contains: input.q, mode: "insensitive" } },
      { fullName: { contains: input.q, mode: "insensitive" } },
    ];
  }
  if (input.role) where.role = input.role;
  if (input.status) where.status = input.status;

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
      select: {
        id: true,
        email: true,
        walletAddress: true,
        fullName: true,
        role: true,
        status: true,
        countryCode: true,
        createdAt: true,
        lastLoginAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { items, total };
}

export async function updateUser(
  userId: string,
  patch: UpdateMeInput,
) {
  await requireUserById(userId);
  return prisma.user.update({
    where: { id: userId },
    data: {
      fullName: patch.fullName,
      phone: patch.phone,
      city: patch.city,
      countryCode: patch.countryCode,
      avatarUrl: patch.avatarUrl,
    },
    select: {
      id: true,
      email: true,
      walletAddress: true,
      fullName: true,
      phone: true,
      city: true,
      countryCode: true,
      avatarUrl: true,
      role: true,
      status: true,
      updatedAt: true,
    },
  });
}

export async function findUserProfile(userId: string) {
  return prisma.userProfile.findUnique({ where: { userId } });
}

export async function updateUserProfile(userId: string, patch: UpdateProfileInput) {
  try {
    return await prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        userType: patch.userType ?? "OTHER",
        ...patch,
        username: patch.username?.toLowerCase(),
      },
      update: {
        ...patch,
        username: patch.username?.toLowerCase(),
      },
    });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      throw new ConflictError("That username is already in use");
    }
    throw error;
  }
}

export async function updateUserRole(userId: string, role: RoleKey) {
  await requireUserById(userId);
  return prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, email: true, role: true },
  });
}

export async function updateUserStatus(userId: string, status: string) {
  await requireUserById(userId);
  return prisma.user.update({
    where: { id: userId },
    data: { status: status as never },
    select: { id: true, email: true, status: true },
  });
}