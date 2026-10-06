import { prisma } from "../../config/database";
import { NotFoundError } from "../../utils/errors";

export async function listWatchlist(userId: string) {
  const items = await prisma.watchlist.findMany({
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
    notifyDeadline: item.notifyDeadline,
    notifyChanges: item.notifyChanges,
  }));
}

export async function addToWatchlist(userId: string, opportunityId: string) {
  return prisma.watchlist.upsert({
    where: { userId_opportunityId: { userId, opportunityId } },
    update: {},
    create: { userId, opportunityId },
  });
}

export async function removeFromWatchlist(userId: string, opportunityId: string) {
  await prisma.watchlist.deleteMany({ where: { userId, opportunityId } });
}

export async function updateWatchlist(
  userId: string,
  opportunityId: string,
  patch: { notifyDeadline?: boolean; notifyChanges?: boolean },
) {
  const existing = await prisma.watchlist.findUnique({
    where: { userId_opportunityId: { userId, opportunityId } },
  });
  if (!existing) throw new NotFoundError("Watchlist entry not found");

  return prisma.watchlist.update({
    where: { userId_opportunityId: { userId, opportunityId } },
    data: {
      notifyDeadline: patch.notifyDeadline ?? existing.notifyDeadline,
      notifyChanges: patch.notifyChanges ?? existing.notifyChanges,
    },
  });
}

export async function isWatching(userId: string, opportunityId: string): Promise<boolean> {
  const entry = await prisma.watchlist.findUnique({
    where: { userId_opportunityId: { userId, opportunityId } },
    select: { id: true },
  });
  return Boolean(entry);
}

export async function watchersForOpportunity(opportunityId: string) {
  return prisma.watchlist.findMany({
    where: { opportunityId },
    select: { userId: true, notifyDeadline: true, notifyChanges: true },
  });
}