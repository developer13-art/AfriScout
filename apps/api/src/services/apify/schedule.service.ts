import { env } from "../../config/env";
import { logger } from "../../config/logger";
import type { CrawlFrequency } from "@prisma/client";
import { CRAWL_FREQUENCY_HOURS } from "../../constants/sourceHealth";

export interface SchedulePlan {
  sourceId: string;
  frequency: CrawlFrequency;
  nextRunAt: Date;
}

export function computeNextRun(frequency: CrawlFrequency, from = new Date()): Date {
  const hours = CRAWL_FREQUENCY_HOURS[frequency as keyof typeof CRAWL_FREQUENCY_HOURS];
  if (hours === null || hours === undefined) return new Date(Number.MAX_SAFE_INTEGER);
  return new Date(from.getTime() + hours * 60 * 60 * 1000);
}

export function planSchedules(
  sources: { id: string; crawlFrequency: CrawlFrequency }[],
): SchedulePlan[] {
  const now = new Date();
  return sources.map((source) => ({
    sourceId: source.id,
    frequency: source.crawlFrequency,
    nextRunAt: computeNextRun(source.crawlFrequency, now),
  }));
}

export function schedulerEnabled(): boolean {
  return env.SCHEDULER_ENABLED;
}

export function logSchedulePlan(plans: SchedulePlan[]): void {
  logger.info({ count: plans.length }, "scheduler_plan_ready");
}