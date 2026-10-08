import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { env } from "../config/env";
import { prisma } from "../config/database";
import { logger } from "../config/logger";
import { dispatchDatabaseJob } from "./dispatch";

interface ClaimedJob {
  id: string;
  name: string;
  payload: Prisma.JsonValue;
  attempts: number;
  max_attempts: number;
  lock_token: string;
}

const POLL_INTERVAL_MS = 750;
const LOCK_LEASE_MS = 3 * 60 * 1000;
const LOCK_HEARTBEAT_MS = 45 * 1000;

async function claimNextJob(): Promise<ClaimedJob | null> {
  const lockToken = randomUUID();
  const rows = await prisma.$queryRaw<ClaimedJob[]>`
    WITH next_job AS (
      SELECT "id"
      FROM "background_jobs"
      WHERE ("status" = 'PENDING' AND "run_at" <= NOW())
         OR ("status" = 'RUNNING' AND "locked_until" <= NOW())
      ORDER BY "run_at" ASC, "created_at" ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    UPDATE "background_jobs" AS job
    SET "status" = 'RUNNING',
        "attempts" = job."attempts" + 1,
        "locked_at" = NOW(),
        "locked_until" = NOW() + INTERVAL '3 minutes',
        "lock_token" = ${lockToken}::uuid,
        "updated_at" = NOW()
    FROM next_job
    WHERE job."id" = next_job."id"
    RETURNING job."id", job."name", job."payload", job."attempts",
              job."max_attempts", job."lock_token"
  `;
  return rows[0] ?? null;
}

async function updateClaimedJob(
  job: ClaimedJob,
  data: {
    status: "SUCCEEDED" | "FAILED" | "PENDING";
    runAt?: Date;
    lastError?: string | null;
  },
): Promise<void> {
  await prisma.backgroundJob.updateMany({
    where: { id: job.id, status: "RUNNING", lockToken: job.lock_token },
    data: {
      status: data.status,
      finishedAt: data.status === "PENDING" ? null : new Date(),
      lockedAt: null,
      lockedUntil: null,
      lockToken: null,
      ...(data.runAt ? { runAt: data.runAt } : {}),
      ...(data.lastError !== undefined ? { lastError: data.lastError } : {}),
    },
  });
}

async function processClaimedJob(job: ClaimedJob): Promise<void> {
  const heartbeat = setInterval(() => {
    void prisma.backgroundJob.updateMany({
      where: { id: job.id, status: "RUNNING", lockToken: job.lock_token },
      data: { lockedUntil: new Date(Date.now() + LOCK_LEASE_MS) },
    }).catch((error: unknown) => {
      logger.warn({ err: error, jobId: job.id }, "database_job_lease_renewal_failed");
    });
  }, LOCK_HEARTBEAT_MS);
  heartbeat.unref();

  try {
    await dispatchDatabaseJob(job);
    await updateClaimedJob(job, { status: "SUCCEEDED", lastError: null });
    logger.info({ jobId: job.id, jobName: job.name }, "database_job_succeeded");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown job error";
    const status = job.attempts < job.max_attempts ? "PENDING" : "FAILED";
    const delay = Math.min(env.JOB_BACKOFF_MS * 2 ** Math.max(0, job.attempts - 1), 15 * 60 * 1000);
    await updateClaimedJob(job, {
      status,
      lastError: message,
      ...(status === "PENDING" ? { runAt: new Date(Date.now() + delay) } : {}),
    });
    logger.error({ err: error, jobId: job.id, jobName: job.name, status }, "database_job_failed");
  } finally {
    clearInterval(heartbeat);
  }
}

export function startDatabaseJobRunner(): () => Promise<void> {
  let stopping = false;
  let pumping: Promise<void> | null = null;
  const active = new Set<Promise<void>>();

  const pump = () => {
    if (stopping || pumping) return;
    pumping = (async () => {
      while (!stopping && active.size < env.JOB_CONCURRENCY) {
        const job = await claimNextJob();
        if (!job) break;
        const task = processClaimedJob(job).finally(() => active.delete(task));
        active.add(task);
      }
    })()
      .catch((error: unknown) => logger.error({ err: error }, "database_job_poll_failed"))
      .finally(() => {
        pumping = null;
      });
  };

  const timer = setInterval(pump, POLL_INTERVAL_MS);
  timer.unref();
  pump();
  logger.info({ concurrency: env.JOB_CONCURRENCY }, "postgres_job_runner_started");

  return async () => {
    stopping = true;
    clearInterval(timer);
    await pumping;
    if (active.size > 0) {
      await Promise.race([
        Promise.allSettled([...active]),
        new Promise<void>((resolve) => setTimeout(resolve, 10_000)),
      ]);
    }
  };
}
