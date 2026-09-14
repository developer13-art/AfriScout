import { prisma } from "../../config/database";
import type { AiTaskType } from "../../types/ai";

export async function recentAnalyses(input: {
  taskType?: AiTaskType;
  provider?: string;
  limit?: number;
}) {
  return prisma.aiAnalysis.findMany({
    where: {
      taskType: input.taskType ? (input.taskType as never) : undefined,
      provider: input.provider ? (input.provider.toUpperCase() as never) : undefined,
    },
    orderBy: { createdAt: "desc" },
    take: input.limit ?? 50,
  });
}

export async function usageForDay(day: Date) {
  return prisma.aiUsageDaily.findMany({
    where: { day },
    orderBy: { costUsd: "desc" },
  });
}

export async function countFallbacks(lastHours = 24): Promise<number> {
  const since = new Date(Date.now() - lastHours * 60 * 60 * 1000);
  return prisma.aiAnalysis.count({
    where: { status: "FALLBACK_USED", createdAt: { gte: since } },
  });
}