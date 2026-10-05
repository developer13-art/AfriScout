import { Worker } from "bullmq";
import { createBullConnection } from "../../config/redis";
import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { MATCH_USERS_JOB } from "../definitions/matchUsers.job";
import { recomputeMatchesForOpportunity } from "../../services/matching/batchMatch.service";
import { enqueueSendNotification } from "../definitions/sendNotification.job";
import { prisma } from "../../config/database";

export function startMatchingWorker(): Worker {
  const worker = new Worker(
    "matching",
    async (job) => {
      if (job.name !== MATCH_USERS_JOB) {
        logger.warn({ jobName: job.name }, "matching_unknown_job");
        return;
      }

      const { opportunityId } = job.data as { opportunityId: string };
      const count = await recomputeMatchesForOpportunity(opportunityId);
      logger.info({ opportunityId, count }, "matches_recomputed");

      // Notify users with new high-score matches.
      const strongMatches = await prisma.match.findMany({
        where: { opportunityId, score: { gte: 85 }, notified: false },
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