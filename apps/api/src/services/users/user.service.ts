import { prisma } from "../../config/database";
import { NotFoundError } from "../../utils/errors";
import type { RoleKey } from "../../constants/roles";

export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      countryCode: true,
      avatarUrl: true,
      role: true,
      status: true,
      emailVerifiedAt: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
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
  patch: {
    fullName?: string;
    phone?: string;
    countryCode?: string;
    avatarUrl?: string;
  },
) {
  await requireUserById(userId);
  return prisma.user.update({
    where: { id: userId },
    data: {
      fullName: patch.fullName,
      phone: patch.phone,
      countryCode: patch.countryCode,
      avatarUrl: patch.avatarUrl,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      countryCode: true,
      avatarUrl: true,
      role: true,
      status: true,
      updatedAt: true,
    },
  });
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