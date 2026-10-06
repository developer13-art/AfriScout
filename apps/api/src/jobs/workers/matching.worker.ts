import { Worker } from "bullmq";
import { createBullConnection } from "../../config/redis";
import { env } from "../../config/env";
import { logger } from "../../config/logger";
import {
  MATCH_USERS_JOB,
  RECOMPUTE_MATCHES_JOB,
  type RecomputeMatchesPayload,
} from "../definitions/matchUsers.job";
import {
  recomputeMatchesForOpportunity,
  recomputeMatchesForUser,
} from "../../services/matching/batchMatch.service";
import { enqueueSendNotification } from "../definitions/sendNotification.job";
import { prisma } from "../../config/database";
import * as AnalystService from "../../services/ai/analyst.service";

type MatchToAnalyze = {
  id: string;
  userId: string;
  dnaProfileId: string;
  opportunityId: string;
};

function buildAiMatchReason(analysis: AnalystService.AnalystResult): string {
  const sections = [
    `Qualification: ${analysis.qualification.replaceAll("_", " ")}. ${analysis.qualificationReason}`,
    `Recommendation: ${analysis.recommendation}`,
    analysis.strengths.length ? `Profile strengths: ${analysis.strengths.join("; ")}` : null,
    analysis.missingRequirements.length
      ? `Missing or uncertain requirements: ${analysis.missingRequirements.join("; ")}`
      : null,
    analysis.concerns.length ? `Concerns: ${analysis.concerns.join("; ")}` : null,
    analysis.credentialEvidence.length
      ? `Credential evidence: ${analysis.credentialEvidence.join("; ")}`
      : null,
    analysis.riskAssessment.length
      ? `Risks: ${analysis.riskAssessment.join("; ")}`
      : null,
    analysis.opportunityChanges.length
      ? `Recent changes: ${analysis.opportunityChanges.join("; ")}`
      : null,
    analysis.nextSteps.length ? `Next steps: ${analysis.nextSteps.join("; ")}` : null,
    analysis.matchExplanation.length
      ? `Match reasoning: ${analysis.matchExplanation.join("; ")}`
      : null,
  ];
  return sections.filter((section): section is string => Boolean(section)).join("\n\n");
}

async function analyzeMatches(matches: MatchToAnalyze[]): Promise<void> {
  for (const match of matches) {
    try {
      const activeDna = await prisma.dnaProfile.findFirst({
        where: { userId: match.userId, isActive: true },
        orderBy: { version: "desc" },
        select: { id: true },
      });
      if (!activeDna || activeDna.id !== match.dnaProfileId) continue;

      const analysis = await AnalystService.analyseOpportunityForUserById({
        userId: match.userId,
        opportunityId: match.opportunityId,
      });
      if (analysis.provider === "mock") {
        throw new Error("No live AI provider was available for match analysis");
      }
      await prisma.match.update({
        where: { id: match.id },
        data: {
          aiMatchQualification: analysis.qualification,
          aiMatchReason: buildAiMatchReason(analysis),
          aiMatchProvider: analysis.provider,
          aiMatchError: null,
          aiMatchAnalyzedAt: new Date(),
        },
      });
    } catch (error) {
      logger.error(
        { err: error, matchId: match.id, opportunityId: match.opportunityId },
        "ai_match_analysis_failed",
      );
      await prisma.match.update({
        where: { id: match.id },
        data: {
          aiMatchQualification: null,
          aiMatchReason: null,
          aiMatchProvider: null,
          aiMatchError: "AI could not generate a match explanation. Check provider configuration and retry.",
          aiMatchAnalyzedAt: new Date(),
        },
      });
    }
  }
}

async function notifyStrongMatches(matches: MatchToAnalyze[]): Promise<void> {
  const strongMatches = await prisma.match.findMany({
    where: {
      id: { in: matches.map((match) => match.id) },
      score: { gte: 85 },
      aiMatchQualification: { in: ["LIKELY", "POSSIBLE_GAPS"] },
      notified: false,
      dnaProfile: { is: { isActive: true } },
      opportunity: { is: { status: "PUBLISHED" } },
    },
    select: { id: true, userId: true, score: true, opportunityId: true },
  });

  for (const match of strongMatches) {
    await enqueueSendNotification({
      userId: match.userId,
      type: "NEW_MATCH",
      title: "New high-match opportunity",
      body: `An opportunity matches your profile at ${match.score}%.`,
      opportunityId: match.opportunityId,
    });
    await prisma.match.update({
      where: { id: match.id },
      data: { notified: true },
    });
  }
}

export function startMatchingWorker(): Worker {
  const worker = new Worker(
    "matching",
    async (job) => {
      let matches: MatchToAnalyze[];
      if (job.name === MATCH_USERS_JOB) {
        const { opportunityId } = job.data as { opportunityId: string };
        const count = await recomputeMatchesForOpportunity(opportunityId);
        logger.info({ opportunityId, count }, "matches_recomputed");
        matches = await prisma.match.findMany({
          where: {
            opportunityId,
            dnaProfile: { is: { isActive: true } },
            opportunity: { is: { status: "PUBLISHED" } },
          },
          select: { id: true, userId: true, dnaProfileId: true, opportunityId: true },
        });
      } else if (job.name === RECOMPUTE_MATCHES_JOB) {
        const { userId } = job.data as RecomputeMatchesPayload;
        const count = await recomputeMatchesForUser(userId);
        logger.info({ userId, count }, "matches_recomputed");
        matches = await prisma.match.findMany({
          where: {
            userId,
            aiMatchAnalyzedAt: null,
            dnaProfile: { is: { isActive: true } },
            opportunity: { is: { status: "PUBLISHED" } },
          },
          orderBy: { computedAt: "desc" },
          take: 200,
          select: { id: true, userId: true, dnaProfileId: true, opportunityId: true },
        });
      } else {
        logger.warn({ jobName: job.name }, "matching_unknown_job");
        return;
      }

      await analyzeMatches(matches);
      await notifyStrongMatches(matches);
    },
    {
      connection: createBullConnection(),
      prefix: env.QUEUE_PREFIX,
      concurrency: env.WORKER_CONCURRENCY,
    },
  );

  worker.on("failed", (job, err) => {
    logger.error({ jobId: job?.id, err }, "matching_job_failed");
  });

  return worker;
}