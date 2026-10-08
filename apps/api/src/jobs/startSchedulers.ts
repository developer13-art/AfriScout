import { env } from "../config/env";
import { logger } from "../config/logger";
import { tickDeadlineScheduler } from "./schedulers/deadlineScheduler";
import { tickExpiryScheduler } from "./schedulers/expiryScheduler";
import { tickHealthScheduler } from "./schedulers/healthScheduler";
import { tickSourceScheduler } from "./schedulers/sourceScheduler";
import { tickSourceSuggestionScheduler } from "./schedulers/sourceSuggestionScheduler";

export function startSchedulers(): () => void {
  if (!env.SCHEDULER_ENABLED) return () => undefined;

  const schedule = (label: string, intervalMs: number, tick: () => Promise<unknown>) => {
    const timer = setInterval(() => {
      void tick().catch((error: unknown) => logger.error({ err: error, scheduler: label }, "scheduler_tick_failed"));
    }, intervalMs);
    timer.unref();
    return timer;
  };

  const timers = [
    schedule("sources", 15 * 60 * 1000, tickSourceScheduler),
    schedule("deadlines", 60 * 60 * 1000, tickDeadlineScheduler),
    schedule("expiry", 24 * 60 * 60 * 1000, tickExpiryScheduler),
    schedule("source-health", 5 * 60 * 1000, tickHealthScheduler),
    schedule("source-suggestions", 15 * 60 * 1000, tickSourceSuggestionScheduler),
  ];
  logger.info("in_api_schedulers_started");
  return () => timers.forEach(clearInterval);
}
