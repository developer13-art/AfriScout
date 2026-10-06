import { Queue } from "bullmq";
import { createBullConnection } from "../../config/redis";
import { env } from "../../config/env";

export const notificationQueue = new Queue("notification", {
  connection: createBullConnection(),
  prefix: env.QUEUE_PREFIX,
  defaultJobOptions: {
    attempts: env.JOB_ATTEMPTS_DEFAULT,
    backoff: { type: "exponential", delay: env.JOB_BACKOFF_MS },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 2000 },
  },
});