import { prisma } from "../../config/database";
import { computeMatch } from "./match.service";
import { logger } from "../../config/logger";
import { enqueueRecomputeMatches } from "../../jobs/definitions/matchUsers.job";

export async function ensureMatchesForUser(userId: string): Promise<boolean> {
  const dna = await prisma.dnaProfile.findFirst({
    where: { userId, isActive: true },
    select: { id: true, updatedAt: true },
    orderBy: { version: "desc" },
  });
  if (!dna) return false;

  const [latestMatch, publishedCount, matchedCount, latestOpportunity, unanalyzedCount] =
    await Promise.all([
      prisma.match.findFirst({
        where: {
          userId,
          dnaProfileId: dna.id,
          opportunity: { is: { status: "PUBLISHED" } },
        },
        orderBy: { computedAt: "desc" },
        select: { computedAt: true },
      }),
      prisma.opportunity.count({ where: { status: "PUBLISHED" } }),
      prisma.match.count({ where: { userId, dnaProfileId: dna.id } }),
      prisma.opportunity.findFirst({
        where: { status: "PUBLISHED" },
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true },
      }),
      prisma.match.count({
        where: {
          userId,
          dnaProfileId: dna.id,
          aiMatchAnalyzedAt: null,
          opportunity: { is: { status: "PUBLISHED" } },
        },
      }),
    ]);

  const expectedMatchCount = Math.min(publishedCount, 200);
  const staleMatches =
    !latestMatch ||
    latestMatch.computedAt < dna.updatedAt ||
    (latestOpportunity !== null && latestMatch.computedAt < latestOpportunity.updatedAt) ||
    matchedCount < expectedMatchCount;
  const needsAnalysis = publishedCount > 0 && (staleMatches || unanalyzedCount > 0);

  if (needsAnalysis) {
    await enqueueRecomputeMatches({
      userId,
      dnaProfileId: dna.id,
      dnaUpdatedAt: dna.updatedAt.getTime(),
    });
  }

  return needsAnalysis;
}

export async function recomputeMatchesForUser(userId: string): Promise<number> {
  const dna = await prisma.dnaProfile.findFirst({
    where: { userId, isActive: true },
    select: { id: true },
  });
  if (!dna) return 0;

  const opportunities = await prisma.opportunity.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true },
    take: 200,
    orderBy: { publishedAt: "desc" },
  });

  let computed = 0;
  for (const opportunity of opportunities) {
    const match = await computeMatch({
      userId,
      dnaProfileId: dna.id,
      opportunityId: opportunity.id,
      invalidateAiExplanation: true,
    });
    if (match) computed += 1;
  }

  logger.info({ userId, computed }, "matches_recomputed");
  return computed;
}

export async function recomputeMatchesForOpportunity(opportunityId: string): Promise<number> {
  const dnaProfiles = await prisma.dnaProfile.findMany({
    where: { isActive: true },
    select: { id: true, userId: true },
    take: 500,
  });

  let computed = 0;
  for (const dna of dnaProfiles) {
    const match = await computeMatch({
      userId: dna.userId,
      dnaProfileId: dna.id,
      opportunityId,
      invalidateAiExplanation: true,
    });
    if (match) computed += 1;
  }

  return computed;
}