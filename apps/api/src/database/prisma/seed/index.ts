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

if (require.main === module) {
  const { prisma, connectDatabase, disconnectDatabase } =
    require("../../../config/database");

  (async () => {
    try {
      await connectDatabase();
      await runSeed({ prisma });
    } catch (error) {
      logger.error({ err: error }, "seed_failed");
      process.exitCode = 1;
    } finally {
      await disconnectDatabase();
    }
  })();
}