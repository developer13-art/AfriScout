import { prisma } from "../../config/database";
import { listMatchesForUser } from "../matching/match.service";

export async function getRadar(userId: string) {
  const now = new Date();
  const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const [matches, newOpportunities, closingSoon, recentlyUpdated, watched, saved] =
    await Promise.all([
      listMatchesForUser(userId, 20),
      prisma.opportunity.findMany({
        where: { status: "PUBLISHED", systemState: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take: 10,
      }),
      prisma.opportunity.findMany({
        where: {
          status: "PUBLISHED",
          deadline: { gte: now, lte: in14Days },
        },
        orderBy: { deadline: "asc" },
        take: 10,
      }),
      prisma.opportunity.findMany({
        where: {
          changes: { some: { detectedAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } } },
        },
        orderBy: { updatedAt: "desc" },
        take: 10,
      }),
      prisma.watchlist.findMany({
        where: { userId },
        include: { opportunity: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.savedOpportunity.findMany({
        where: { userId },
        include: { opportunity: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

  return {
    strongMatches: matches.matches,
    newOpportunities,
    closingSoon,
    recentlyUpdated,
    watched: watched.map((w) => w.opportunity),
    saved: saved.map((s) => s.opportunity),
  };
}