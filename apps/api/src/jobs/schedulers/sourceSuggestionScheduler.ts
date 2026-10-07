import { prisma } from "../../config/database";
import { logger } from "../../config/logger";

export async function tickSourceSuggestionScheduler(): Promise<number> {
  const pending = await prisma.sourceSuggestion.count({
    where: { status: "SUGGESTED" },
  });
  logger.info({ pending }, "source_suggestion_scheduler_tick");
  return pending;
}