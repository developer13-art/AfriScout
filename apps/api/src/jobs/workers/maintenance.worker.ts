import { Worker } from "bullmq";
import { createBullConnection } from "../../config/redis";
import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { EXPIRE_OPPORTUNITIES_JOB } from "../definitions/expireOpportunities.job";
import { REFRESH_SOURCE_HEALTH_JOB } from "../definitions/refreshSourceHealth.job";
import { expireOpportunities } from "../../services/opportunities/expiry.service";
import { recomputeSourceHealth } from "../../services/sources/sourceHealth.service";
import { prisma } from "../../config/database";

export function startMaintenanceWorker(): Worker {
  const worker = new Worker(
    "maintenance",
    async (job) => {
      switch (job.name) {
        case EXPIRE_OPPORTUNITIES_JOB: {
          const count = await expireOpportunities();
          logger.info({ count }, "maintenance_expired");
          break;
        }
        case REFRESH_SOURCE_HEALTH_JOB: {
          const { sourceId } = job.data as { sourceId?: string };
          if (sourceId) {
            await recomputeSourceHealth(sourceId);
          } else {
            const sources = await prisma.source.findMany({ select: { id: true } });
            for (const source of sources) await recomputeSourceHealth(source.id);
          }
          break;
        }
        default:
          logger.warn({ jobName: job.name }, "maintenance_unknown_job");
      }
    },
    {
      connection: createBullConnection(),
      prefix: env.QUEUE_PREFIX,
      concurrency: 2,
    },
  );

  worker.on("failed", (job, err) => {
    logger.error({ jobId: job?.id, err }, "maintenance_job_failed");
  });

  return worker;
}