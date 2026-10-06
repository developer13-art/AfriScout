export const SOURCE_HEALTH = {
  UNKNOWN: "UNKNOWN",
  HEALTHY: "HEALTHY",
  WARNING: "WARNING",
  FAILED: "FAILED",
  INACTIVE: "INACTIVE",
} as const;

export type SourceHealthKey = keyof typeof SOURCE_HEALTH;

export const SOURCE_HEALTH_THRESHOLDS = {
  warningAfterConsecutiveFailures: 1,
  failedAfterConsecutiveFailures: 3,
  inactiveAfterDaysWithoutRuns: 30,
} as const;

export const CRAWL_FREQUENCIES = {
  EVERY_6_HOURS: "EVERY_6_HOURS",
  EVERY_12_HOURS: "EVERY_12_HOURS",
  DAILY: "DAILY",
  WEEKLY: "WEEKLY",
  MANUAL: "MANUAL",
} as const;

export type CrawlFrequencyKey = keyof typeof CRAWL_FREQUENCIES;

export const CRAWL_FREQUENCY_HOURS: Record<CrawlFrequencyKey, number | null> = {
  EVERY_6_HOURS: 6,
  EVERY_12_HOURS: 12,
  DAILY: 24,
  WEEKLY: 168,
  MANUAL: null,
};