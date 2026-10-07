import { prisma } from "../../config/database";

export interface AdminDashboardKpis {
  sourcesTotal: number;
  sourcesActive: number;
  sourcesHealthy: number;
  opportunitiesTotal: number;
  opportunitiesPublished: number;
  opportunitiesClosingSoon: number;
  duplicatesPending: number;
  actorRuns24h: number;
  actorRunsFailed24h: number;
  changes24h: number;
  usersTotal: number;
  usersActive: number;
}

export interface DiscoveryPoint {
  day: string;
  count: number;
}

export interface SourceHealthRow {
  id: string;
  name: string;
  countryCode: string | null;
  sourceType: string;
  health: string;
  active: boolean;
  lastRunAt: string | null;
  consecutiveFailures: number;
}

export interface RecentRunRow {
  id: string;
  sourceId: string;
  sourceName: string | null;
  status: string;
  trigger: string;
  itemsFound: number;
  itemsImported: number;
  itemsDuplicate: number;
  startedAt: string | null;
  finishedAt: string | null;
  durationMs: number | null;
  createdAt: string;
}

export interface RecentChangeRow {
  id: string;
  opportunityId: string;
  field: string;
  severity: string;
  detectedAt: string;
  notified: boolean;
}

export interface RecentAuditRow {
  id: string;
  action: string;
  actorUserId: string | null;
  entityType: string | null;
  entityId: string | null;
  createdAt: string;
}

export interface CategoryCount {
  category: string;
  count: number;
}

export interface CountryCount {
  countryCode: string;
  count: number;
}

export interface AdminDashboardPayload {
  kpis: AdminDashboardKpis;
  discovery: DiscoveryPoint[];
  sourceHealth: {
    healthy: number;
    warning: number;
    failed: number;
    inactive: number;
    attention: SourceHealthRow[];
  };
  recentRuns: RecentRunRow[];
  recentChanges: RecentChangeRow[];
  recentAudit: RecentAuditRow[];
  categoryBreakdown: CategoryCount[];
  countryBreakdown: CountryCount[];
  systemStatus: {
    dbOk: boolean;
    redisOk: boolean;
    apifyConfigured: boolean;
    aiEnabled: boolean;
    queueDepth: number | null;
    workerCount: number | null;
  };
}

function startOfUtcDay(input: Date): Date {
  const date = new Date(input);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

export async function getAdminDashboard(): Promise<AdminDashboardPayload> {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const next14 = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const last14Days = startOfUtcDay(new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000));

  const [
    sourcesTotal,
    sourcesActive,
    sourcesHealthy,
    opportunitiesTotal,
    opportunitiesPublished,
    opportunitiesClosingSoon,
    duplicatesPending,
    actorRuns24h,
    actorRunsFailed24h,
    changes24h,
    usersTotal,
    usersActive,
    attentionSources,
    recentRunsRaw,
    recentChanges,
    recentAudit,
    categoryRows,
    countryRows,
    discoveryRows,
    healthHealthy,
    healthWarning,
    healthFailed,
    healthInactive,
  ] = await Promise.all([
    prisma.source.count(),
    prisma.source.count({ where: { active: true } }),
    prisma.source.count({ where: { health: "HEALTHY" } }),
    prisma.opportunity.count(),
    prisma.opportunity.count({ where: { status: "PUBLISHED" } }),
    prisma.opportunity.count({
      where: { deadline: { gte: now, lte: next14 }, status: "PUBLISHED" },
    }),
    prisma.opportunityDuplicate.count({ where: { status: "PENDING" } }),
    prisma.sourceRun.count({ where: { createdAt: { gte: last24h } } }),
    prisma.sourceRun.count({
      where: { status: "FAILED", createdAt: { gte: last24h } },
    }),
    prisma.opportunityChange.count({ where: { detectedAt: { gte: last24h } } }),
    prisma.user.count(),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.source.findMany({
      where: { health: { in: ["WARNING", "FAILED"] } },
      orderBy: { consecutiveFailures: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        countryCode: true,
        sourceType: true,
        health: true,
        active: true,
        lastRunAt: true,
        consecutiveFailures: true,
      },
    }),
    prisma.sourceRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        sourceId: true,
        status: true,
        trigger: true,
        itemsFound: true,
        itemsImported: true,
        itemsDuplicate: true,
        startedAt: true,
        finishedAt: true,
        durationMs: true,
        createdAt: true,
        source: { select: { name: true } },
      },
    }),
    prisma.opportunityChange.findMany({
      orderBy: { detectedAt: "desc" },
      take: 10,
      select: {
        id: true,
        opportunityId: true,
        field: true,
        severity: true,
        detectedAt: true,
        notified: true,
      },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        action: true,
        actorUserId: true,
        entityType: true,
        entityId: true,
        createdAt: true,
      },
    }),
    prisma.opportunity.groupBy({
      by: ["category"],
      _count: { _all: true },
    }),
    prisma.opportunity.groupBy({
      by: ["countryCode"],
      _count: { _all: true },
      where: { countryCode: { not: null } },
    }),
    prisma.sourceRun.findMany({
      where: { createdAt: { gte: last14Days } },
      select: { createdAt: true, itemsImported: true, itemsUpdated: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.source.count({ where: { health: "HEALTHY" } }),
    prisma.source.count({ where: { health: "WARNING" } }),
    prisma.source.count({ where: { health: "FAILED" } }),
    prisma.source.count({ where: { health: "INACTIVE" } }),
  ]);

  const dayBuckets = new Map<string, number>();
  for (let i = 0; i < 14; i += 1) {
    const day = new Date(last14Days.getTime() + i * 24 * 60 * 60 * 1000);
    const key = day.toISOString().slice(0, 10);
    dayBuckets.set(key, 0);
  }
  for (const row of discoveryRows) {
    const key = startOfUtcDay(row.createdAt).toISOString().slice(0, 10);
    if (dayBuckets.has(key)) {
      const delta = (row.itemsImported ?? 0) + (row.itemsUpdated ?? 0);
      dayBuckets.set(key, (dayBuckets.get(key) ?? 0) + delta);
    }
  }
  const discovery: DiscoveryPoint[] = Array.from(dayBuckets.entries()).map(
    ([day, count]) => ({ day, count }),
  );

  const sourceHealth = {
    healthy: healthHealthy,
    warning: healthWarning,
    failed: healthFailed,
    inactive: healthInactive,
    attention: attentionSources.map((s) => ({
      id: s.id,
      name: s.name,
      countryCode: s.countryCode,
      sourceType: s.sourceType,
      health: s.health,
      active: s.active,
      lastRunAt: s.lastRunAt ? s.lastRunAt.toISOString() : null,
      consecutiveFailures: s.consecutiveFailures,
    })),
  };

  const recentRuns: RecentRunRow[] = recentRunsRaw.map((run) => ({
    id: run.id,
    sourceId: run.sourceId,
    sourceName: run.source?.name ?? null,
    status: run.status,
    trigger: run.trigger,
    itemsFound: run.itemsFound,
    itemsImported: run.itemsImported,
    itemsDuplicate: run.itemsDuplicate,
    startedAt: run.startedAt ? run.startedAt.toISOString() : null,
    finishedAt: run.finishedAt ? run.finishedAt.toISOString() : null,
    durationMs: run.durationMs,
    createdAt: run.createdAt.toISOString(),
  }));

  const recentChangeRows: RecentChangeRow[] = recentChanges.map((c) => ({
    id: c.id,
    opportunityId: c.opportunityId,
    field: c.field,
    severity: c.severity,
    detectedAt: c.detectedAt.toISOString(),
    notified: c.notified,
  }));

  const recentAuditRows: RecentAuditRow[] = recentAudit.map((a) => ({
    id: a.id,
    action: a.action,
    actorUserId: a.actorUserId,
    entityType: a.entityType,
    entityId: a.entityId,
    createdAt: a.createdAt.toISOString(),
  }));

  const categoryBreakdown: CategoryCount[] = categoryRows.map((row) => ({
    category: row.category,
    count: row._count._all,
  }));

  const countryBreakdown: CountryCount[] = countryRows
    .filter((row) => row.countryCode)
    .map((row) => ({
      countryCode: row.countryCode as string,
      count: row._count._all,
    }));

  const kpis: AdminDashboardKpis = {
    sourcesTotal,
    sourcesActive,
    sourcesHealthy,
    opportunitiesTotal,
    opportunitiesPublished,
    opportunitiesClosingSoon,
    duplicatesPending,
    actorRuns24h,
    actorRunsFailed24h,
    changes24h,
    usersTotal,
    usersActive,
  };

  return {
    kpis,
    discovery,
    sourceHealth,
    recentRuns,
    recentChanges: recentChangeRows,
    recentAudit: recentAuditRows,
    categoryBreakdown,
    countryBreakdown,
    systemStatus: {
      dbOk: true,
      redisOk: true,
      apifyConfigured: false,
      aiEnabled: true,
      queueDepth: null,
      workerCount: null,
    },
  };
}