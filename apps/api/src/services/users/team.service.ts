import { prisma } from "../../config/database";
import { ConflictError, ForbiddenError, NotFoundError } from "../../utils/errors";

async function requireManager(organizationId: string, userId: string) {
  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId } },
    select: { role: true },
  });
  if (!member || (member.role !== "OWNER" && member.role !== "ADMIN")) {
    throw new ForbiddenError("Only organization owners and admins can manage this team");
  }
}

export async function listMembers(organizationId: string, requesterId: string) {
  const membership = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: requesterId } },
  });
  if (!membership) throw new ForbiddenError("You are not a member of this organization");
  return prisma.organizationMember.findMany({
    where: { organizationId },
    orderBy: { createdAt: "asc" },
  });
}

export async function addMember(input: {
  organizationId: string;
  userId: string;
  role: string;
  actorUserId: string;
}) {
  await requireManager(input.organizationId, input.actorUserId);
  const organization = await prisma.organization.findUnique({
    where: { id: input.organizationId },
    select: { id: true },
  });
  if (!organization) throw new NotFoundError("Organization not found");

  const identifier = input.userId.trim();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier);
  const invitedUser = await prisma.user.findFirst({
    where: isUuid
      ? { id: identifier }
      : { email: { equals: identifier.toLowerCase(), mode: "insensitive" } },
    select: { id: true },
  });
  if (!invitedUser) {
    throw new NotFoundError("No Scout account was found for that email or user ID");
  }

  const existing = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: input.organizationId,
        userId: invitedUser.id,
      },
    },
  });
  if (existing) throw new ConflictError("User is already a member");

  return prisma.organizationMember.create({
    data: {
      organizationId: input.organizationId,
      userId: invitedUser.id,
      role: input.role as never,
    },
  });
}

export async function removeMember(
  organizationId: string,
  memberId: string,
  actorUserId: string,
) {
  await requireManager(organizationId, actorUserId);
  const target = await prisma.organizationMember.findFirst({
    where: { id: memberId, organizationId },
    select: { userId: true, role: true },
  });
  if (!target) throw new NotFoundError("Organization member not found");
  if (target.role === "OWNER") {
    const ownerCount = await prisma.organizationMember.count({
      where: { organizationId, role: "OWNER" },
    });
    if (ownerCount <= 1) throw new ConflictError("An organization must keep at least one owner");
    if (target.userId !== actorUserId) {
      const actor = await prisma.organizationMember.findUnique({
        where: { organizationId_userId: { organizationId, userId: actorUserId } },
        select: { role: true },
      });
      if (actor?.role !== "OWNER") throw new ForbiddenError("Only an owner can remove another owner");
    }
  }
  await prisma.organizationMember.delete({ where: { id: memberId } });
}