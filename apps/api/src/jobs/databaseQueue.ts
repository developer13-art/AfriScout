import { Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { env } from "../config/env";

export interface EnqueueOptions {
  maxAttempts?: number;
  runAt?: Date;
}

export interface QueueAddOptions {
  attempts?: number;
  jobId?: string;
  removeOnComplete?: boolean | number | { count: number };
  removeOnFail?: boolean | number | { count: number };
}

export async function enqueueDatabaseJob<T>(
  name: string,
  payload: T,
  options: EnqueueOptions = {},
) {
  return prisma.backgroundJob.create({
    data: {
      name,
      payload: JSON.parse(JSON.stringify(payload)) as Prisma.InputJsonValue,
      maxAttempts: options.maxAttempts ?? env.JOB_ATTEMPTS_DEFAULT,
      ...(options.runAt ? { runAt: options.runAt } : {}),
    },
  });
}

export function createDatabaseQueue(defaultAttempts: number) {
  return {
    add<T>(name: string, payload: T, options?: QueueAddOptions) {
      return enqueueDatabaseJob(name, payload, {
        maxAttempts: options?.attempts ?? defaultAttempts,
      });
    },
  };
}
