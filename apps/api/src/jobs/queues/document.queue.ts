import { Queue } from "bullmq";
import { createBullConnection } from "../../config/redis";
import { env } from "../../config/env";

export const documentQueue = new Queue("document", {
  connection: createBullConnection(),
  prefix: env.QUEUE_PREFIX,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: env.JOB_BACKOFF_MS },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 1000 },
  },
});