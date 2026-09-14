import { prisma } from "../../config/database";

export async function listSaved(userId: string) {
  const items = await prisma.savedOpportunity.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  const opportunities = await prisma.opportunity.findMany({
    where: { id: { in: items.map((i) => i.opportunityId) } },
  });
  const map: Record<string, (typeof opportunities)[number]> = {};
  for (const o of opportunities) map[o.id] = o;
  return items.map((item) => ({
    id: item.id,
    opportunityId: item.opportunityId,
    opportunity: map[item.opportunityId],
    createdAt: item.createdAt,
  }));
}

export async function addSaved(userId: string, opportunityId: string) {
  return prisma.savedOpportunity.upsert({
    where: { userId_opportunityId: { userId, opportunityId } },
    update: {},
    create: { userId, opportunityId },
  });
}

export async function removeSaved(userId: string, opportunityId: string) {
  await prisma.savedOpportunity.deleteMany({ where: { userId, opportunityId } });
}

export async function isSaved(userId: string, opportunityId: string): Promise<boolean> {
  const entry = await prisma.savedOpportunity.findUnique({
    where: { userId_opportunityId: { userId, opportunityId } },
    select: { id: true },
  });
  return Boolean(entry);
}