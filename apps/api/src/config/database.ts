import { PrismaClient } from "@prisma/client";
import { env, isProduction, isTest } from "./env";
import { logger } from "./logger";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: env.DATABASE_URL } },
    log: isProduction
      ? ["error", "warn"]
      : ["error", "warn", "info"],
  });

if (!isProduction) {
  globalForPrisma.prisma = prisma;
}

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info("Database connection established");
  } catch (error) {
    logger.error({ err: error }, "Database connection failed");
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (isTest) return;
  await prisma.$disconnect();
  logger.info("Database connection closed");
}
export async function pingDatabase(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}