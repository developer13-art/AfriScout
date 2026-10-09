import type { PrismaClient } from "@prisma/client";
import { DEFAULT_MATCH_WEIGHTS, MATCH_WEIGHTS_VERSION } from "../../../constants/matchWeights";
import { logger } from "../../../config/logger";

export async function seedSettings(prisma: PrismaClient): Promise<void> {
  const defaults: { key: string; value: unknown; description: string }[] = [
    {
      key: "match.default_weights",
      value: DEFAULT_MATCH_WEIGHTS,
      description: "Default match weights applied to USER accounts",
    },
    {
      key: "match.weights_version",
      value: MATCH_WEIGHTS_VERSION,
      description: "Version identifier for the current default weights",
    },
    {
      key: "system.maintenance_mode",
      value: false,
      description: "Blocks non-admin traffic when enabled",
    },
    {
      key: "system.scheduler_enabled",
      value: true,
      description: "Enables recurring source and deadline jobs",
    },
    {
      key: "signup.enabled",
      value: true,
      description: "Whether new accounts can register",
    },
  ];

  for (const setting of defaults) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { description: setting.description },
      create: {
        key: setting.key,
        value: setting.value as never,
        description: setting.description,
      },
    });
  }

  const flags: { key: string; enabled: boolean; description: string }[] = [
    { key: "feature.ask_afriscout", enabled: true, description: "Natural language search" },
    { key: "feature.opportunity_map", enabled: true, description: "African opportunity map" },
    { key: "feature.api_portal", enabled: true, description: "Developer API portal" },
    { key: "feature.public_api", enabled: true, description: "Public API endpoints" },
  ];

  for (const flag of flags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: { description: flag.description },
      create: flag,
    });
  }

  logger.info(
    { settings: defaults.length, flags: flags.length },
    "settings_seeded",
  );
}