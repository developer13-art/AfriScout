import type { PrismaClient, Prisma } from "@prisma/client";
import { CURRENCIES } from "../../../utils/currency";
import { logger } from "../../../config/logger";

const CURRENCIES_KEY = "geo.currencies";

export async function seedCurrencies(prisma: PrismaClient): Promise<void> {
  const value = Object.values(CURRENCIES) as unknown as Prisma.InputJsonValue;
  await prisma.systemSetting.upsert({
    where: { key: CURRENCIES_KEY },
    update: { value },
    create: {
      key: CURRENCIES_KEY,
      value,
      description: "Supported currencies with symbol and decimals",
    },
  });
  logger.info({ count: Object.values(CURRENCIES).length }, "currencies_seeded");
}