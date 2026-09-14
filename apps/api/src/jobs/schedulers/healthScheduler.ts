import { prisma } from "../../config/database";
import { recomputeSourceHealth } from "../../services/sources/sourceHealth.service";
import { logger } from "../../config/logger";

export async function tickHealthScheduler(): Promise<number> {
  const sources = await prisma.source.findMany({ select: { id: true } });
  for (const source of sources) await recomputeSourceHealth(source.id);
  logger.info({ count: sources.length }, "health_scheduler_tick");
  return sources.length;
}