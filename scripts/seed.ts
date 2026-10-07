#!/usr/bin/env tsx
import { prisma, connectDatabase, disconnectDatabase } from "../apps/api/src/config/database";
import { runSeed } from "../apps/api/src/database/prisma/seed";
import { logger } from "../apps/api/src/config/logger";

async function main(): Promise<void> {
  try {
    await connectDatabase();
    await runSeed({ prisma });
    logger.info("seed_script_completed");
  } catch (error) {
    logger.error({ err: error }, "seed_script_failed");
    process.exitCode = 1;
  } finally {
    await disconnectDatabase();
  }
}

void main();