import type { PrismaClient } from "@prisma/client";
import {
  OPPORTUNITY_CATEGORIES,
  OPPORTUNITY_CATEGORY_LABELS,
  OPPORTUNITY_TYPES,
  OPPORTUNITY_TYPE_LABELS,
} from "../../../constants/categories";
import { logger } from "../../../config/logger";

const CATEGORIES_KEY = "categories.catalogue";

export async function seedCategories(prisma: PrismaClient): Promise<void> {
  const value = {
    categories: Object.values(OPPORTUNITY_CATEGORIES).map((key) => ({
      key,
      label: OPPORTUNITY_CATEGORY_LABELS[key],
    })),
    types: Object.values(OPPORTUNITY_TYPES).map((key) => ({
      key,
      label: OPPORTUNITY_TYPE_LABELS[key],
    })),
  };

  await prisma.systemSetting.upsert({
    where: { key: CATEGORIES_KEY },
    update: { value, description: "Opportunity categories and types" },
    create: {
      key: CATEGORIES_KEY,
      value,
      description: "Opportunity categories and types",
    },
  });

  logger.info("categories_seeded");
}