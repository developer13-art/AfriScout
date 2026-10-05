import { prisma } from "../../config/database";
import { computeNextRun, schedulerEnabled } from "../apify/schedule.service";
import { logger } from "../../config/logger";

export interface ScheduledSource {
  sourceId: string;
  name: string;
  nextRunAt: Date;
}

export async function listScheduledSources(): Promise<ScheduledSource[]> {
  if (!schedulerEnabled()) return [];

  const sources = await prisma.source.findMany({
    where: { active: true },
    select: { id: true, name: true, crawlFrequency: true, lastRunAt: true },
  });

  return sources.map((source) => ({
    sourceId: source.id,
    name: source.name,
    nextRunAt: computeNextRun(source.crawlFrequency, source.lastRunAt ?? new Date()),
  }));
}

export async function dueSources(now = new Date()): Promise<ScheduledSource[]> {
  const scheduled = await listScheduledSources();
  const due = scheduled.filter((entry) => entry.nextRunAt.getTime() <= now.getTime());
  logger.debug({ count: due.length }, "sources_due");
  return due;
}

export async function markScheduled(sourceId: string): Promise<void> {
  await prisma.source.update({
    where: { id: sourceId },
    data: { lastRunAt: new Date() },
  });
}