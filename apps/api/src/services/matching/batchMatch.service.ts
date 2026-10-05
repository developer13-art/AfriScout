import { prisma } from "../../config/database";
import { computeMatch } from "./match.service";
import { logger } from "../../config/logger";

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
    });
    if (match) computed += 1;
  }

  return computed;
}