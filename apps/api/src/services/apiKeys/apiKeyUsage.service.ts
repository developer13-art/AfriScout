import { prisma } from "../../config/database";

export async function recordUsage(input: {
  apiKeyId: string;
  error?: boolean;
}): Promise<void> {
  const day = new Date();
  day.setUTCHours(0, 0, 0, 0);

  await prisma.apiKeyUsageDaily.upsert({
    where: { apiKeyId_day: { apiKeyId: input.apiKeyId, day } },
    update: {
      requests: { increment: 1 },
      errors: input.error ? { increment: 1 } : undefined,
    },
    create: {
      apiKeyId: input.apiKeyId,
      day,
      requests: 1,
      errors: input.error ? 1 : 0,
    },
  });
}

export async function usageForApiKey(apiKeyId: string, days = 30) {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);
  return prisma.apiKeyUsageDaily.findMany({
    where: { apiKeyId, day: { gte: since } },
    orderBy: { day: "asc" },
  });
}