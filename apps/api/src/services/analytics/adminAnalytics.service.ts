import { prisma } from "../../config/database";

export async function adminAnalytics() {
  const now = new Date();
  const last24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [
    sourcesTotal,
    sourcesHealthy,
    sourcesWarning,
    sourcesFailed,
    sourcesInactive,
    opportunitiesTotal,
    opportunitiesPublished,
    opportunitiesExpired,
    duplicatesPending,
    changesLast24h,
    actorRunsLast24h,
    actorRunsFailedLast24h,
  ] = await Promise.all([
    prisma.source.count(),
    prisma.source.count({ where: { health: "HEALTHY" } }),
    prisma.source.count({ where: { health: "WARNING" } }),
    prisma.source.count({ where: { health: "FAILED" } }),
    prisma.source.count({ where: { health: "INACTIVE" } }),
    prisma.opportunity.count(),
    prisma.opportunity.count({ where: { status: "PUBLISHED" } }),
    prisma.opportunity.count({ where: { systemState: "EXPIRED" } }),
    prisma.opportunityDuplicate.count({ where: { status: "PENDING" } }),
    prisma.opportunityChange.count({ where: { detectedAt: { gte: last24 } } }),
    prisma.sourceRun.count({ where: { createdAt: { gte: last24 } } }),
    prisma.sourceRun.count({ where: { status: "FAILED", createdAt: { gte: last24 } } }),
  ]);

  return {
    sourcesTotal,
    sourcesHealthy,
    sourcesWarning,
    sourcesFailed,
    sourcesInactive,
    opportunitiesTotal,
    opportunitiesPublished,
    opportunitiesExpired,
    duplicatesPending,
    changesLast24h,
    actorRunsLast24h,
    actorRunsFailedLast24h,
  };
}