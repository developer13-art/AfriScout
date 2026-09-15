import { http } from "./http";

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

export const adminDashboardService = {
  get: () => http<AdminDashboardPayload>("/analytics/admin/dashboard"),
};