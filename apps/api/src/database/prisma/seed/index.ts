import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import type { PrismaClient } from "@prisma/client";
import { logger } from "../../../config/logger";
import { seedRoles } from "./roles.seed";
import { seedPermissions } from "./permissions.seed";
import { seedCategories } from "./categories.seed";
import { seedSubcategories } from "./subcategories.seed";
import { seedCountries } from "./countries.seed";
import { seedLocations } from "./locations.seed";
import { seedCurrencies } from "./currencies.seed";
import { seedSettings } from "./settings.seed";
import { seedNotificationTemplates } from "./notificationTemplates.seed";
import { seedSuperAdmin } from "./superAdmin.seed";

export interface SeedContext {
  prisma: PrismaClient;
}

export async function runSeed({ prisma }: SeedContext): Promise<void> {
  const startedAt = Date.now();
  logger.info("seed_started");

  await seedRoles(prisma);
  await seedPermissions(prisma);
  await seedCategories(prisma);
  await seedSubcategories(prisma);
  await seedCountries(prisma);
  await seedLocations(prisma);
  await seedCurrencies(prisma);
  await seedSettings(prisma);
  await seedNotificationTemplates(prisma);
  await seedSuperAdmin(prisma);

  const durationMs = Date.now() - startedAt;
  logger.info({ durationMs }, "seed_completed");
}

const isEntryPoint =
  typeof process !== "undefined" &&
  process.argv[1] !== undefined &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isEntryPoint) {
  const { prisma, connectDatabase, disconnectDatabase } = await import(
    "../../../config/database"
  );
  try {
    await connectDatabase();
    await runSeed({ prisma });
  } catch (error) {
    logger.error({ err: error }, "seed_failed");
    process.exitCode = 1;
  } finally {
    await disconnectDatabase();
  }
}