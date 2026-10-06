import { Worker } from "bullmq";
import { createBullConnection } from "../../config/redis";
import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { DELIVER_WEBHOOK_JOB } from "../definitions/deliverWebhook.job";
import { deliverWebhook } from "../../services/webhooks/outboundWebhook.service";

export function startWebhookWorker(): Worker {
  const worker = new Worker(
    "webhook",
    async (job) => {
      if (job.name === DELIVER_WEBHOOK_JOB) {
        const { deliveryId } = job.data as { deliveryId: string };
        await deliverWebhook(deliveryId);
      }
    },
    {
      connection: createBullConnection(),
      prefix: env.QUEUE_PREFIX,
      concurrency: 5,
    },
  );

  worker.on("failed", (job, err) => {
    logger.error({ jobId: job?.id, err }, "webhook_job_failed");
  });

  return worker;
}