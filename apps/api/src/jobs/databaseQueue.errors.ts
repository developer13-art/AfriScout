import { Prisma } from "@prisma/client";
import { AppError } from "../utils/errors";

const BACKGROUND_JOBS_MIGRATION = "20261008130000_postgres_jobs_and_rate_limits";

export function isBackgroundJobsTableMissingError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError
    && error.code === "P2021"
    && /background_jobs/i.test(error.message);
}

export function backgroundJobsTableError(error: unknown): AppError {
  return new AppError(
    "DATABASE_SCHEMA_NOT_READY",
    "The background job table is not available. The database migration must be applied before discovery runs can be queued.",
    503,
    {
      migration: BACKGROUND_JOBS_MIGRATION,
      prismaCode: error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined,
    },
  );
}
