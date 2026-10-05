import { prisma } from "../../config/database";
import { toDnaMatchInput } from "../dna/dnaBuilder.service";
import { getWeightsForUserType } from "./weights.service";
import { scoreOpportunity } from "./scoring.service";
import { scoreCapability } from "./capabilityMatch.service";
import { scoreLocation } from "./locationMatch.service";
import { scoreValue } from "./valueMatch.service";
import { scoreEligibility } from "./eligibilityMatch.service";
import { buildReasons } from "./reasons.service";
import { buildConcerns } from "./concerns.service";
import { bandForScore } from "../../constants/matchWeights";
import { logger } from "../../config/logger";

export async function computeMatch(input: {
  userId: string;
  dnaProfileId: string;
  opportunityId: string;
}) {
  const [dna, opportunity, userProfile] = await Promise.all([
    prisma.dnaProfile.findUnique({ where: { id: input.dnaProfileId } }),
    prisma.opportunity.findUnique({ where: { id: input.opportunityId } }),
    prisma.userProfile.findUnique({ where: { userId: input.userId } }),
  ]);

  if (!dna || !opportunity) return null;

  const dnaInput = toDnaMatchInput(dna);

  const industry = {
    score: dnaInput.industries.some((i) => opportunity.title.toLowerCase().includes(i.toLowerCase()))
      ? 25
      : 12,
    reason: "Industry alignment analysed",
  };
  const capability = scoreCapability(dnaInput, {
    title: opportunity.title,
    description: opportunity.description,
    requirements: opportunity.requirements,
    category: opportunity.category,
  });
  const location = scoreLocation(dnaInput, {
    countryCode: opportunity.countryCode,
    city: opportunity.city,
    region: opportunity.region,
    isRemote: opportunity.isRemote,
  });
  const value = scoreValue(dnaInput, {
    valueMin: opportunity.valueMin ? Number(opportunity.valueMin) : null,
    valueMax: opportunity.valueMax ? Number(opportunity.valueMax) : null,
    currency: opportunity.currency,
  });
  const eligibility = scoreEligibility(dnaInput, {
    eligibility: opportunity.eligibility,
    requirements: opportunity.requirements,
  });

  const weights = await getWeightsForUserType(userProfile?.userType ?? "BUSINESS");
  const { total, breakdown } = scoreOpportunity(
    {
      industryScore: industry.score,
      locationScore: location.score,
      capabilityScore: capability.score,
      valueScore: value.score,
      eligibilityScore: eligibility.score,
      experienceScore: 7,
    },
    weights.weights,
  );

  const reasons = buildReasons({ industry, location, capability, value, eligibility });
  const concerns = buildConcerns({ industry, location, capability, value, eligibility });

  const match = await prisma.match.upsert({
    where: {
      userId_opportunityId_dnaProfileId: {
        userId: input.userId,
        opportunityId: input.opportunityId,
        dnaProfileId: input.dnaProfileId,
      },
    },
    update: {
      score: total,
      band: bandForScore(total) as never,
      breakdown: breakdown as never,
      reasons: reasons as never,
      concerns: concerns as never,
      weightsVersion: weights.version,
      computedAt: new Date(),
    },
    create: {
      userId: input.userId,
      opportunityId: input.opportunityId,
      dnaProfileId: input.dnaProfileId,
      score: total,
      band: bandForScore(total) as never,
      breakdown: breakdown as never,
      reasons: reasons as never,
      concerns: concerns as never,
      weightsVersion: weights.version,
    },
  });

  logger.debug({ userId: input.userId, opportunityId: input.opportunityId, score: total }, "match_computed");
  return match;
}

export async function listMatchesForUser(userId: string, limit = 50) {
  const matches = await prisma.match.findMany({
    where: { userId },
    orderBy: { score: "desc" },
    take: limit,
  });

  const opportunityIds = matches.map((m) => m.opportunityId);
  const opportunities = await prisma.opportunity.findMany({
    where: { id: { in: opportunityIds } },
  });

  const map: Record<string, (typeof opportunities)[number]> = {};
  for (const opportunity of opportunities) map[opportunity.id] = opportunity;

  return { matches, opportunities: map };
}

export async function getMatchForOpportunity(userId: string, opportunityId: string) {
  return prisma.match.findFirst({
    where: { userId, opportunityId },
    orderBy: { computedAt: "desc" },
  });
}