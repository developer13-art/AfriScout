import { Queue } from "bullmq";
import { createBullConnection } from "../../config/redis";
import { env } from "../../config/env";

export const matchingQueue = new Queue("matching", {
  connection: createBullConnection(),
  prefix: env.QUEUE_PREFIX,
  defaultJobOptions: {
    attempts: env.JOB_ATTEMPTS_DEFAULT,
    backoff: { type: "exponential", delay: env.JOB_BACKOFF_MS },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 2000 },
  },
});