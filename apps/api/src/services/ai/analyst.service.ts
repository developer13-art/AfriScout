import { z } from "zod";
import { prisma } from "../../config/database";
import { runAi } from "./ai.service";
import {
  ANALYST_PROMPT,
  ANALYST_PROMPT_VERSION,
  type AnalystPromptInput,
} from "./prompts/analyst.prompt";
import type { AiAnalystPayload } from "../../types/ai";
import { InternalError } from "../../utils/errors";
import { computeMatch } from "../matching/match.service";
import * as OpportunityService from "../opportunities/opportunity.service";

const analystPayloadSchema = z.object({
  qualification: z.enum(["LIKELY", "POSSIBLE_GAPS", "UNLIKELY", "INSUFFICIENT_EVIDENCE"]),
  qualificationReason: z.string().min(1).max(2000),
  recommendation: z.string().min(1).max(2000),
  strengths: z.array(z.string().min(1).max(500)).max(20),
  concerns: z.array(z.string().min(1).max(500)).max(20),
  missingRequirements: z.array(z.string().min(1).max(500)).max(20),
  credentialEvidence: z.array(z.string().min(1).max(500)).max(20),
  riskAssessment: z.array(z.string().min(1).max(500)).max(20),
  opportunityChanges: z.array(z.string().min(1).max(500)).max(20),
  nextSteps: z.array(z.string().min(1).max(500)).max(20),
  matchExplanation: z.array(z.string().min(1).max(500)).max(20),
});

export interface AnalystResult extends AiAnalystPayload {
  qualification: z.infer<typeof analystPayloadSchema>["qualification"];
  qualificationReason: string;
  credentialEvidence: string[];
  riskAssessment: string[];
  opportunityChanges: string[];
  match: AnalystPromptInput["match"];
  context: {
    reputationScore: number;
    verifiedCredentialCount: number;
    unanchoredAchievementCount: number;
    completedOpportunityCount: number;
    verifiedContributionCount: number;
    walletVerified: boolean;
    onChainRewardVerified: boolean;
  };
  provider: string;
  model: string;
  analyzedAt: string;
}

function requireField<T>(value: T | undefined, field: string): T {
  if (value === undefined) {
    throw new InternalError(`AI analyst response is missing ${field}`);
  }
  return value;
}

function parseAnalystPayload(output: unknown): AiAnalystPayload {
  const parsed = analystPayloadSchema.parse(output);
  return {
    qualification: requireField(parsed.qualification, "qualification"),
    qualificationReason: requireField(parsed.qualificationReason, "qualificationReason"),
    recommendation: requireField(parsed.recommendation, "recommendation"),
    strengths: requireField(parsed.strengths, "strengths"),
    concerns: requireField(parsed.concerns, "concerns"),
    missingRequirements: requireField(parsed.missingRequirements, "missingRequirements"),
    credentialEvidence: requireField(parsed.credentialEvidence, "credentialEvidence"),
    riskAssessment: requireField(parsed.riskAssessment, "riskAssessment"),
    opportunityChanges: requireField(parsed.opportunityChanges, "opportunityChanges"),
    nextSteps: requireField(parsed.nextSteps, "nextSteps"),
    matchExplanation: requireField(parsed.matchExplanation, "matchExplanation"),
  };
}

function jsonString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return typeof value === "string" ? value : JSON.stringify(value);
}

function parseMatchBreakdown(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item: unknown) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    if (
      typeof row.label !== "string" ||
      typeof row.score !== "number" ||
      typeof row.max !== "number"
    ) {
      return [];
    }
    return [{ label: row.label, score: row.score, max: row.max }];
  });
}

function parseMatchNotes(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item: unknown) => {
    if (typeof item === "string") return [item];
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    if (typeof row.detail === "string") return [row.detail];
    if (typeof row.label === "string") return [row.label];
    return [];
  });
}

export async function analyseOpportunityForUser(input: {
  userId: string;
  opportunityId: string;
  opportunity: AnalystPromptInput["opportunity"];
}): Promise<AnalystResult> {
  const [
    user,
    profile,
    professionalProfile,
    studentProfile,
    dna,
    achievements,
    submissions,
    bounty,
    opportunityChanges,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: input.userId },
      select: { walletAddress: true, walletVerifiedAt: true },
    }),
    prisma.userProfile.findUnique({
      where: { userId: input.userId },
      select: {
        userType: true,
        headline: true,
        professionalIdentities: true,
      },
    }),
    prisma.professionalProfile.findUnique({
      where: { userId: input.userId },
      select: {
        profession: true,
        seniority: true,
        yearsExperience: true,
        skills: true,
        certifications: true,
      },
    }),
    prisma.studentProfile.findUnique({
      where: { userId: input.userId },
      select: {
        educationLevel: true,
        fieldOfStudy: true,
        institution: true,
        interests: true,
      },
    }),
    prisma.dnaProfile.findFirst({
      where: { userId: input.userId, isActive: true },
      orderBy: { version: "desc" },
    }),
    prisma.verifiedAchievement.findMany({
      where: { userId: input.userId },
      select: {
        title: true,
        description: true,
        points: true,
        proofTxSignature: true,
      },
      orderBy: { issuedAt: "desc" },
      take: 50,
    }),
    prisma.opportunitySubmission.findMany({
      where: { userId: input.userId },
      select: {
        status: true,
        participationTxSignature: true,
        submissionProofTxSignature: true,
      },
      take: 500,
    }),
    prisma.bounty.findUnique({
      where: { opportunityId: input.opportunityId },
      select: {
        rewardAmount: true,
        rewardCurrency: true,
        fundingStatus: true,
        fundingTxSignature: true,
      },
    }),
    prisma.opportunityChange.findMany({
      where: { opportunityId: input.opportunityId },
      select: {
        field: true,
        oldValue: true,
        newValue: true,
        severity: true,
        detectedAt: true,
      },
      orderBy: { detectedAt: "desc" },
      take: 10,
    }),
  ]);

  const matchRecord = dna
    ? await computeMatch({
        userId: input.userId,
        dnaProfileId: dna.id,
        opportunityId: input.opportunityId,
      })
    : null;

  const match = matchRecord
    ? {
        score: matchRecord.score,
        band: matchRecord.band,
        breakdown: parseMatchBreakdown(matchRecord.breakdown),
        reasons: parseMatchNotes(matchRecord.reasons),
        concerns: parseMatchNotes(matchRecord.concerns),
      }
    : null;

  const verifiedAchievements = achievements.filter((achievement) => achievement.proofTxSignature);
  const unanchoredAchievements = achievements.filter((achievement) => !achievement.proofTxSignature);
  const completedOpportunities = submissions.filter((submission) => submission.status === "APPROVED");
  const verifiedContributions = completedOpportunities.filter(
    (submission) => submission.participationTxSignature || submission.submissionProofTxSignature,
  );
  const onChainProofSubmissionCount = submissions.filter(
    (submission) => submission.submissionProofTxSignature,
  ).length;
  const walletVerified = Boolean(user?.walletAddress && user.walletVerifiedAt);
  const onChainRewardVerified = Boolean(
    bounty?.fundingStatus === "FUNDED" && bounty.fundingTxSignature,
  );

  const promptInput: AnalystPromptInput = {
    profile: {
      userType: profile?.userType ?? null,
      headline: profile?.headline ?? null,
      professionalIdentities: profile?.professionalIdentities ?? [],
      skills: professionalProfile?.skills ?? [],
      certifications: professionalProfile?.certifications ?? [],
      education: [
        studentProfile?.educationLevel,
        studentProfile?.fieldOfStudy,
        studentProfile?.institution,
        ...(studentProfile?.interests ?? []),
      ].filter((item): item is string => Boolean(item)),
      industries: dna?.industries ?? [],
      capabilities: dna?.capabilities ?? [],
      sectors: dna?.sectors ?? [],
      preferredCountries: dna?.preferredCountries ?? [],
      preferredLocations: dna?.preferredLocations ?? [],
      opportunityTypes: dna?.opportunityTypes ?? [],
      opportunityCategories: dna?.opportunityCategories ?? [],
      eligibilityNotes: dna?.eligibilityNotes ?? null,
      experienceNotes: [
        professionalProfile?.profession,
        professionalProfile?.seniority,
        professionalProfile?.yearsExperience !== null &&
        professionalProfile?.yearsExperience !== undefined
          ? `${professionalProfile.yearsExperience} years experience`
          : null,
        onChainProofSubmissionCount
          ? `${onChainProofSubmissionCount} Devnet work proof fingerprint(s)`
          : null,
        dna?.experienceNotes,
      ]
        .filter((item): item is string => Boolean(item))
        .join("; ") || null,
      walletVerified,
      reputationScore: achievements.reduce((sum, achievement) => sum + achievement.points, 0),
      verifiedCredentials: verifiedAchievements.map(
        (achievement) => `${achievement.title}${achievement.description ? `: ${achievement.description}` : ""}`,
      ),
      unanchoredAchievements: unanchoredAchievements.map(
        (achievement) => `${achievement.title}${achievement.description ? `: ${achievement.description}` : ""}`,
      ),
      completedOpportunities: completedOpportunities.length,
      verifiedContributions: verifiedContributions.length,
    },
    opportunity: input.opportunity,
    match,
    opportunityChanges: opportunityChanges.map((change) => ({
      field: change.field,
      oldValue: jsonString(change.oldValue),
      newValue: jsonString(change.newValue),
      severity: change.severity,
      detectedAt: change.detectedAt.toISOString(),
    })),
    bounty: bounty
      ? {
          rewardAmount: bounty.rewardAmount.toString(),
          rewardCurrency: bounty.rewardCurrency,
          fundingStatus: bounty.fundingStatus,
          verifiedOnChain: onChainRewardVerified,
        }
      : null,
  };

  const result = await runAi({
    taskType: "ANALYST",
    promptVersion: ANALYST_PROMPT_VERSION,
    systemPrompt:
      "You are Scout's evidence-based opportunity intelligence analyst. Follow the supplied output schema and never invent user, credential, blockchain, or opportunity facts.",
    userPrompt: ANALYST_PROMPT(promptInput),
    responseFormat: "json",
    opportunityId: input.opportunityId,
    validateOutput: parseAnalystPayload,
  });

  const parsed = parseAnalystPayload(result.output);
  return {
    qualification: parsed.qualification,
    qualificationReason: parsed.qualificationReason,
    recommendation: parsed.recommendation,
    strengths: parsed.strengths,
    concerns: parsed.concerns,
    missingRequirements: parsed.missingRequirements,
    credentialEvidence: parsed.credentialEvidence,
    riskAssessment: parsed.riskAssessment,
    opportunityChanges: parsed.opportunityChanges,
    nextSteps: parsed.nextSteps,
    matchExplanation: parsed.matchExplanation,
    match,
    context: {
      reputationScore: promptInput.profile.reputationScore,
      verifiedCredentialCount: verifiedAchievements.length,
      unanchoredAchievementCount: unanchoredAchievements.length,
      completedOpportunityCount: completedOpportunities.length,
      verifiedContributionCount: verifiedContributions.length,
      walletVerified,
      onChainRewardVerified,
    },
    provider: result.provider,
    model: result.model,
    analyzedAt: new Date().toISOString(),
  };
}

export async function analyseOpportunityForUserById(input: {
  userId: string;
  opportunityId: string;
}): Promise<AnalystResult> {
  const opportunity = await OpportunityService.getOpportunityById(input.opportunityId);
  return analyseOpportunityForUser({
    userId: input.userId,
    opportunityId: opportunity.id,
    opportunity: {
      title: opportunity.title,
      description: opportunity.description,
      eligibility: opportunity.eligibility,
      requirements: opportunity.requirements,
      structuredRequirements: opportunity.requirementsList.map((requirement) => ({
        kind: requirement.kind,
        label: requirement.label,
        description: requirement.description,
        mandatory: requirement.isMandatory,
      })),
      deadline: opportunity.deadline ? opportunity.deadline.toISOString() : null,
      valueMin: opportunity.valueMin ? Number(opportunity.valueMin) : null,
      valueMax: opportunity.valueMax ? Number(opportunity.valueMax) : null,
      currency: opportunity.currency,
      countryCode: opportunity.countryCode,
      region: opportunity.region,
      city: opportunity.city,
      isRemote: opportunity.isRemote,
      category: opportunity.category,
      opportunityType: opportunity.opportunityType,
      organizationName: opportunity.organizationName,
      verificationStatus: opportunity.verificationStatus,
      provenanceProofCount: opportunity.provenanceProofs.length,
    },
  });
}
