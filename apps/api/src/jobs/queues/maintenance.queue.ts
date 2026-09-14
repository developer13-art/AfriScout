import { Queue } from "bullmq";
import { createBullConnection } from "../../config/redis";
import { env } from "../../config/env";

export const maintenanceQueue = new Queue("maintenance", {
  connection: createBullConnection(),
  prefix: env.QUEUE_PREFIX,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 500 },
  },
});