import { Worker } from "bullmq";
import { createBullConnection } from "../../config/redis";
import { env } from "../../config/env";
import { logger } from "../../config/logger";
import {
  MATCH_USERS_JOB,
  RECOMPUTE_MATCHES_JOB,
} from "../definitions/matchUsers.job";
import { RECOMPUTE_ALL_MATCHES_JOB } from "../definitions/recomputeMatches.job";
import {
  computeMatch,
  listMatchesForUser,
} from "../../services/matching/match.service";
import { recomputeMatchesForOpportunity, recomputeMatchesForUser } from "../../services/matching/batchMatch.service";
import { prisma } from "../../config/database";

export function startMatchingWorker(): Worker {
  const worker = new Worker(
    "matching",
    async (job) => {
      switch (job.name) {
        case MATCH_USERS_JOB: {
          const { opportunityId } = job.data as { opportunityId: string };
          await recomputeMatchesForOpportunity(opportunityId);
          break;
        }
        case RECOMPUTE_MATCHES_JOB: {
          const { userId } = job.data as { userId: string };
          await recomputeMatchesForUser(userId);
          break;
        }
        case RECOMPUTE_ALL_MATCHES_JOB: {
          const users = await prisma.dnaProfile.findMany({
            where: { isActive: true },
            select: { userId: true },
            take: 1000,
          });
          for (const entry of users) {
            await recomputeMatchesForUser(entry.userId);
          }
          break;
        }
        default:
          logger.warn({ jobName: job.name }, "matching_unknown_job");
      }
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

export async function matchesForUser(userId: string) {
  return listMatchesForUser(userId);
}

export async function singleMatch(userId: string, dnaId: string, opportunityId: string) {
  return computeMatch({ userId, dnaProfileId: dnaId, opportunityId });
}