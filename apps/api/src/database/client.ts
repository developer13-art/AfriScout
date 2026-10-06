import { PrismaClient } from "@prisma/client";
import { env, isProduction, isTest } from "../config/env";
import { logger } from "../config/logger";

declare global {
  // eslint-disable-next-line no-var
  var __afriscoutPrisma: PrismaClient | undefined;
}

function buildClient(): PrismaClient {
  return new PrismaClient({
    datasources: { db: { url: env.DATABASE_URL } },
    log: isProduction
      ? ["error", "warn"]
      : isTest
        ? ["error"]
        : ["error", "warn", "info"],
  });
}

export const prisma: PrismaClient =
  global.__afriscoutPrisma ?? buildClient();

if (!isProduction) {
  global.__afriscoutPrisma = prisma;
}

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info("database_connected");
  } catch (error) {
    logger.error({ err: error }, "database_connection_failed");
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (isTest) return;
  try {
    await prisma.$disconnect();
    logger.info("database_disconnected");
  } catch (error) {
    logger.error({ err: error }, "database_disconnect_failed");
  }
}

export async function pingDatabase(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}