import { prisma } from "../../config/database";
import { ConflictError, NotFoundError } from "../../utils/errors";

export async function listMembers(organizationId: string) {
  return prisma.organizationMember.findMany({
    where: { organizationId },
    orderBy: { createdAt: "asc" },
  });
}

export async function addMember(input: {
  organizationId: string;
  userId: string;
  role: string;
}) {
  const organization = await prisma.organization.findUnique({
    where: { id: input.organizationId },
    select: { id: true },
  });
  if (!organization) throw new NotFoundError("Organization not found");

  const existing = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: input.organizationId,
        userId: input.userId,
      },
    },
  });
  if (existing) throw new ConflictError("User is already a member");

  return prisma.organizationMember.create({
    data: {
      organizationId: input.organizationId,
      userId: input.userId,
      role: input.role as never,
    },
  });
}

export async function removeMember(organizationId: string, memberId: string) {
  await prisma.organizationMember.deleteMany({
    where: { id: memberId, organizationId },
  });
}