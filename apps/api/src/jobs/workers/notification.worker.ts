import { Worker } from "bullmq";
import { createBullConnection } from "../../config/redis";
import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { SEND_NOTIFICATION_JOB } from "../definitions/sendNotification.job";
import { dispatchNotification } from "../../services/notifications/dispatcher.service";

export function startNotificationWorker(): Worker {
  const worker = new Worker(
    "notification",
    async (job) => {
      if (job.name === SEND_NOTIFICATION_JOB) {
        await dispatchNotification(job.data);
      } else {
        logger.warn({ jobName: job.name }, "notification_unknown_job");
      }
    },
    {
      connection: createBullConnection(),
      prefix: env.QUEUE_PREFIX,
      concurrency: env.WORKER_CONCURRENCY,
    },
  );

  worker.on("failed", (job, err) => {
    logger.error({ jobId: job?.id, err }, "notification_job_failed");
  });

  return worker;
}