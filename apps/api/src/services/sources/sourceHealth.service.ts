import { prisma } from "../../config/database";
import { logger } from "../../config/logger";
import { SOURCE_HEALTH_THRESHOLDS } from "../../constants/sourceHealth";

export async function recomputeSourceHealth(sourceId: string): Promise<void> {
  const source = await prisma.source.findUnique({
    where: { id: sourceId },
    select: { id: true, consecutiveFailures: true, active: true },
  });
  if (!source) return;

  let health: "HEALTHY" | "WARNING" | "FAILED" | "INACTIVE" = "HEALTHY";

  if (!source.active) {
    health = "INACTIVE";
  } else if (source.consecutiveFailures >= SOURCE_HEALTH_THRESHOLDS.failedAfterConsecutiveFailures) {
    health = "FAILED";
  } else if (source.consecutiveFailures >= SOURCE_HEALTH_THRESHOLDS.warningAfterConsecutiveFailures) {
    health = "WARNING";
  }

  await prisma.source.update({
    where: { id: sourceId },
    data: { health },
  });

  logger.info({ sourceId, health }, "source_health_recomputed");
}

export async function recordRunOutcome(input: {
  sourceId: string;
  success: boolean;
  itemsFound: number;
}): Promise<void> {
  if (input.success) {
    await prisma.source.update({
      where: { id: input.sourceId },
      data: {
        lastSuccessAt: new Date(),
        lastRunAt: new Date(),
        consecutiveFailures: 0,
        successCount: { increment: 1 },
        itemsTotal: { increment: input.itemsFound },
      },
    });
  } else {
    await prisma.source.update({
      where: { id: input.sourceId },
      data: {
        lastFailureAt: new Date(),
        lastRunAt: new Date(),
        consecutiveFailures: { increment: 1 },
        failureCount: { increment: 1 },
      },
    });
  }
  await recomputeSourceHealth(input.sourceId);
}

export async function healthOverview() {
  const [healthy, warning, failed, inactive] = await Promise.all([
    prisma.source.count({ where: { health: "HEALTHY" } }),
    prisma.source.count({ where: { health: "WARNING" } }),
    prisma.source.count({ where: { health: "FAILED" } }),
    prisma.source.count({ where: { health: "INACTIVE" } }),
  ]);

  return { healthy, warning, failed, inactive };
}