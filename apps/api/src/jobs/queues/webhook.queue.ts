import { Queue } from "bullmq";
import { createBullConnection } from "../../config/redis";
import { env } from "../../config/env";

export const webhookQueue = new Queue("webhook", {
  connection: createBullConnection(),
  prefix: env.QUEUE_PREFIX,
  defaultJobOptions: {
    attempts: env.OUTBOUND_WEBHOOK_MAX_ATTEMPTS,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 2000 },
  },
});