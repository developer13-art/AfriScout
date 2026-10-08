import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  backgroundJobsTableError,
  isBackgroundJobsTableMissingError,
} from "./databaseQueue.errors";

describe("isBackgroundJobsTableMissingError", () => {
  it("recognizes the production Prisma missing-table error", () => {
    const error = new Prisma.PrismaClientKnownRequestError(
      "The table `public.background_jobs` does not exist in the current database.",
      {
        code: "P2021",
        clientVersion: "5.22.0",
        meta: { modelName: "BackgroundJob", table: "public.background_jobs" },
      },
    );

    expect(isBackgroundJobsTableMissingError(error)).toBe(true);
  });

  it("does not classify unrelated Prisma errors as a missing table", () => {
    const error = new Prisma.PrismaClientKnownRequestError(
      "Database connection failed.",
      {
        code: "P2002",
        clientVersion: "5.22.0",
        meta: { modelName: "BackgroundJob" },
      },
    );

    expect(isBackgroundJobsTableMissingError(error)).toBe(false);
  });

  it("returns a stable schema-not-ready application error", () => {
    const error = new Prisma.PrismaClientKnownRequestError(
      "The table `public.background_jobs` does not exist in the current database.",
      {
        code: "P2021",
        clientVersion: "5.22.0",
        meta: { modelName: "BackgroundJob", table: "public.background_jobs" },
      },
    );

    const appError = backgroundJobsTableError(error);

    expect(appError).toMatchObject({
      code: "DATABASE_SCHEMA_NOT_READY",
      statusCode: 503,
      details: {
        migration: "20261008130000_postgres_jobs_and_rate_limits",
        prismaCode: "P2021",
      },
    });
  });
});
