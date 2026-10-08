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
  invalidateAiExplanation?: boolean;
}) {
  const [
    dna,
    opportunity,
    userProfile,
    professionalProfile,
    completedOpportunityCount,
    onChainParticipationCount,
    achievementCount,
    anchoredAchievementCount,
  ] = await Promise.all([
    prisma.dnaProfile.findUnique({ where: { id: input.dnaProfileId } }),
    prisma.opportunity.findUnique({ where: { id: input.opportunityId } }),
    prisma.userProfile.findUnique({ where: { userId: input.userId } }),
    prisma.professionalProfile.findUnique({
      where: { userId: input.userId },
      select: { yearsExperience: true },
    }),
    prisma.opportunitySubmission.count({
      where: { userId: input.userId, status: "APPROVED" },
    }),
    prisma.opportunitySubmission.count({
      where: { userId: input.userId, participationTxSignature: { not: null } },
    }),
    prisma.verifiedAchievement.count({ where: { userId: input.userId } }),
    prisma.verifiedAchievement.count({
      where: { userId: input.userId, proofTxSignature: { not: null } },
    }),
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
  const scoringVersion = `evidence-v2/${weights.version}`;
  const experienceMax = weights.weights.experience;
  const profileExperienceMax = Math.round(experienceMax * 0.6);
  const verifiedHistoryMax = Math.round(experienceMax * 0.2);
  const verifiedCredentialMax =
    experienceMax - profileExperienceMax - verifiedHistoryMax;
  const yearsExperience = professionalProfile?.yearsExperience;
  const experienceScore = yearsExperience == null
    ? 0
    : profileExperienceMax * Math.min(Math.max(yearsExperience, 0), 10) / 10;
  const verifiedHistoryScore = Math.min(
    verifiedHistoryMax,
    completedOpportunityCount + Math.max(0, onChainParticipationCount - completedOpportunityCount) * 0.25,
  );
  const verifiedCredentialScore = Math.min(
    verifiedCredentialMax,
    achievementCount * 0.5 + anchoredAchievementCount * 0.5,
  );
  const { total, breakdown } = scoreOpportunity(
    {
      industryScore: industry.score,
      locationScore: location.score,
      capabilityScore: capability.score,
      valueScore: value.score,
      eligibilityScore: eligibility.score,
      experienceScore,
      verifiedHistoryScore,
      verifiedCredentialScore,
      experienceReason: yearsExperience == null
        ? "Add years of experience to your Scout professional profile."
        : `${yearsExperience} years recorded in your professional profile.`,
      verifiedHistoryReason: completedOpportunityCount || onChainParticipationCount
        ? `${completedOpportunityCount} approved contribution(s) and ${onChainParticipationCount} Devnet participation receipt(s).`
        : "No organization-approved work or Devnet participation receipts yet.",
      verifiedCredentialReason: achievementCount
        ? `${achievementCount} organization-issued achievement(s); ${anchoredAchievementCount} anchored on Devnet.`
        : "No organization-issued achievements yet.",
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
      ...(input.invalidateAiExplanation
        ? {
            aiMatchQualification: null,
            aiMatchReason: null,
            aiMatchProvider: null,
            aiMatchError: null,
            aiMatchAnalyzedAt: null,
          }
        : {}),
      weightsVersion: scoringVersion,
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
      aiMatchQualification: null,
      aiMatchReason: null,
      aiMatchProvider: null,
      aiMatchError: null,
      aiMatchAnalyzedAt: null,
      weightsVersion: scoringVersion,
    },
  });

  logger.debug({ userId: input.userId, opportunityId: input.opportunityId, score: total }, "match_computed");
  return match;
}

export async function listMatchesForUser(userId: string, limit = 50) {
  const dna = await prisma.dnaProfile.findFirst({
    where: { userId, isActive: true },
    orderBy: { version: "desc" },
    select: { id: true },
  });
  if (!dna) {
    return { matches: [], opportunities: {}, aiAnalysisErrorCount: 0 };
  }

  const matchWhere = {
    userId,
    dnaProfileId: dna.id,
    opportunity: { is: { status: "PUBLISHED" as const } },
  };
  const [matches, aiAnalysisErrorCount] = await Promise.all([
    prisma.match.findMany({
      where: {
        ...matchWhere,
        aiMatchQualification: { in: ["LIKELY", "POSSIBLE_GAPS"] },
      },
      orderBy: { score: "desc" },
      take: limit,
    }),
    prisma.match.count({
      where: {
        ...matchWhere,
        aiMatchError: { not: null },
      },
    }),
  ]);

  const opportunityIds = matches.map((m) => m.opportunityId);
  const opportunities = await prisma.opportunity.findMany({
    where: { id: { in: opportunityIds } },
  });

  const map: Record<string, (typeof opportunities)[number]> = {};
  for (const opportunity of opportunities) map[opportunity.id] = opportunity;

  return { matches, opportunities: map, aiAnalysisErrorCount };
}

export async function getMatchForOpportunity(userId: string, opportunityId: string) {
  return prisma.match.findFirst({
    where: { userId, opportunityId },
    orderBy: { computedAt: "desc" },
  });
}