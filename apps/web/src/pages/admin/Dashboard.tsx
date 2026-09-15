import { Link } from "react-router-dom";
import {
  Database,
  Layers,
  AlertTriangle,
  Activity,
  Users,
  Calendar,
  PlayCircle,
  ArrowRight,
  GitCompareArrows,
  HeartPulse,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { StatCard } from "../../components/dashboard/StatCard";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Loader } from "../../components/ui/Loader";
import { ErrorState } from "../../components/ui/ErrorState";
import { EmptyState } from "../../components/ui/EmptyState";
import { LineChart } from "../../components/charts/LineChart";
import { DonutChart } from "../../components/charts/DonutChart";
import { SeoHead } from "../../components/common/SeoHead";
import { useAdminDashboard } from "../../hooks/useAdminDashboard";
import { labelForCategory } from "../../config/categories";
import { countryName } from "../../config/countries";
import { formatDateTime, formatRelative } from "../../utils/formatDate";

const categoryPalette = [
  "#0F766E",
  "#10B981",
  "#F59E0B",
  "#0EA5E9",
  "#E11D48",
  "#8B5CF6",
  "#F97316",
  "#14B8A6",
  "#DC2626",
  "#6366F1",
  "#22C55E",
  "#FACC15",
  "#0891B2",
  "#A855F7",
  "#EF4444",
  "#22D3EE",
  "#84CC16",
];

function runStatusTone(status: string): "neutral" | "info" | "success" | "warning" | "danger" {
  switch (status) {
    case "SUCCEEDED":
      return "success";
    case "FAILED":
      return "danger";
    case "ABORTED":
    case "TIMED_OUT":
      return "warning";
    case "RUNNING":
      return "info";
    default:
      return "neutral";
  }
}

function severityTone(severity: string): "neutral" | "warning" | "danger" {
  if (severity === "CRITICAL") return "danger";
  if (severity === "IMPORTANT") return "warning";
  return "neutral";
}

export function Dashboard() {
  const query = useAdminDashboard();

  if (query.isLoading) return <Loader fullPage label="Loading admin dashboard" />;
  if (query.isError || !query.data) {
    return (
      <ErrorState
        title="Could not load the admin dashboard"
        description="The API returned an error. Try refreshing in a moment."
      />
    );
  }

  const { kpis, discovery, sourceHealth, recentRuns, recentChanges, recentAudit, categoryBreakdown, countryBreakdown, systemStatus } = query.data;

  const discoveryChartData = discovery.map((p) => ({
    label: p.day.slice(5),
    value: p.count,
  }));

  const categoryChartData = categoryBreakdown.length > 0
    ? categoryBreakdown.map((row, index) => ({
        label: labelForCategory(row.category),
        value: row.count,
        color: categoryPalette[index % categoryPalette.length]!,
      }))
    : [];

  const countryRows = countryBreakdown.slice(0, 8);

  return (
    <>
      <SeoHead title="Admin dashboard" />
      <PageHeader
        title="Admin dashboard"
        description="Operations overview across sources, discovery, and intelligence."
        actions={
          <Link
            to="/admin/sources/new"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary-700 hover:underline"
          >
            Add source <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      />

      {/* Row 1 — KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Sources"
          value={kpis.sourcesTotal}
          hint={`${kpis.sourcesActive} active, ${kpis.sourcesHealthy} healthy`}
          icon={<Database className="h-4 w-4" />}
          tone="primary"
        />
        <StatCard
          label="Opportunities"
          value={kpis.opportunitiesTotal}
          hint={`${kpis.opportunitiesPublished} published`}
          icon={<Layers className="h-4 w-4" />}
        />
        <StatCard
          label="Closing soon"
          value={kpis.opportunitiesClosingSoon}
          hint="Within the next 14 days"
          icon={<Calendar className="h-4 w-4" />}
          tone="warning"
        />
        <StatCard
          label="Duplicates pending"
          value={kpis.duplicatesPending}
          hint="Awaiting review"
          icon={<GitCompareArrows className="h-4 w-4" />}
          tone="danger"
        />
        <StatCard
          label="Actor runs (24h)"
          value={kpis.actorRuns24h}
          hint={`${kpis.actorRunsFailed24h} failed`}
          icon={<PlayCircle className="h-4 w-4" />}
          tone={kpis.actorRunsFailed24h > 0 ? "danger" : "success"}
        />
        <StatCard
          label="Changes (24h)"
          value={kpis.changes24h}
          hint="Detected across watched opportunities"
          icon={<Activity className="h-4 w-4" />}
          tone="success"
        />
        <StatCard
          label="Users"
          value={kpis.usersTotal}
          hint={`${kpis.usersActive} active`}
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          label="AI providers"
          value={systemStatus.aiEnabled ? "On" : "Off"}
          hint={systemStatus.apifyConfigured ? "Apify configured" : "Apify not configured"}
          icon={<Sparkles className="h-4 w-4" />}
          tone={systemStatus.aiEnabled ? "success" : "neutral"}
        />
      </div>

      {/* Row 2 — Discovery chart + source health */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Discovery over the last 14 days"
            subtitle="Items imported into the opportunity database per day"
          />
          <CardBody>
            {discoveryChartData.some((p) => p.value > 0) ? (
              <LineChart data={discoveryChartData} height={240} />
            ) : (
              <EmptyState
                icon={<Activity className="h-6 w-6" />}
                title="No discovery activity yet"
                description="Add a source and run discovery to see the trend here."
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Source health" />
          <CardBody>
            <ul className="space-y-3">
              <HealthRow
                label="Healthy"
                count={sourceHealth.healthy}
                tone="success"
                icon={<CheckCircle2 className="h-4 w-4" />}
              />
              <HealthRow
                label="Warning"
                count={sourceHealth.warning}
                tone="warning"
                icon={<AlertTriangle className="h-4 w-4" />}
              />
              <HealthRow
                label="Failed"
                count={sourceHealth.failed}
                tone="danger"
                icon={<XCircle className="h-4 w-4" />}
              />
              <HealthRow
                label="Inactive"
                count={sourceHealth.inactive}
                tone="neutral"
                icon={<Clock className="h-4 w-4" />}
              />
            </ul>

            {sourceHealth.attention.length > 0 ? (
              <>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Needs attention
                </p>
                <ul className="mt-2 divide-y divide-neutral-100">
                  {sourceHealth.attention.slice(0, 4).map((source) => (
                    <li key={source.id} className="py-2">
                      <Link
                        to={`/admin/sources/${source.id}`}
                        className="flex items-center justify-between gap-2 text-sm hover:text-primary-700"
                      >
                        <span className="truncate">{source.name}</span>
                        <Badge
                          tone={source.health === "FAILED" ? "danger" : "warning"}
                          size="sm"
                        >
                          {source.health}
                        </Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </CardBody>
        </Card>
      </div>

      {/* Row 3 — Category + Country breakdown */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Opportunities by category" />
          <CardBody>
            {categoryChartData.length > 0 ? (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="w-full sm:w-1/2">
                  <DonutChart data={categoryChartData} height={220} />
                </div>
                <ul className="w-full space-y-2 sm:w-1/2">
                  {categoryChartData.map((slice) => (
                    <li
                      key={slice.label}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="flex items-center gap-2 text-neutral-700">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: slice.color }}
                          aria-hidden
                        />
                        {slice.label}
                      </span>
                      <span className="text-neutral-500">{slice.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <EmptyState
                icon={<Layers className="h-6 w-6" />}
                title="No opportunities yet"
                description="Once discovery runs, category distribution will appear here."
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Top countries" />
          <CardBody>
            {countryRows.length > 0 ? (
              <ul className="space-y-2">
                {countryRows.map((row) => {
                  const max = Math.max(...countryRows.map((r) => r.count), 1);
                  const width = Math.round((row.count / max) * 100);
                  return (
                    <li key={row.countryCode}>
                      <div className="flex items-center justify-between text-xs text-neutral-700">
                        <span>{countryName(row.countryCode)}</span>
                        <span className="text-neutral-500">{row.count}</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
                        <div
                          className="h-full bg-primary-600"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState
                icon={<Database className="h-6 w-6" />}
                title="No country activity yet"
                description="Country distribution will appear as opportunities are discovered."
              />
            )}
          </CardBody>
        </Card>
      </div>

      {/* Row 4 — Recent runs + recent changes */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Recent actor runs"
            actions={
              <Link
                to="/admin/actor-runs"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary-700 hover:underline"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            }
          />
          <CardBody>
            {recentRuns.length > 0 ? (
              <ul className="divide-y divide-neutral-100">
                {recentRuns.slice(0, 6).map((run) => (
                  <li key={run.id} className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-neutral-900">
                          {run.sourceName ?? run.sourceId}
                        </p>
                        <p className="mt-0.5 text-xs text-neutral-500">
                          {run.trigger} · Found {run.itemsFound} · Imported{" "}
                          {run.itemsImported} · Duplicates {run.itemsDuplicate}
                        </p>
                      </div>
                      <Badge tone={runStatusTone(run.status)} size="sm">
                        {run.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-[11px] text-neutral-400">
                      {run.startedAt
                        ? formatDateTime(run.startedAt)
                        : formatDateTime(run.createdAt)}
                      {run.durationMs
                        ? ` · ${Math.round(run.durationMs / 1000)}s`
                        : ""}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={<PlayCircle className="h-6 w-6" />}
                title="No actor runs yet"
                description="Trigger a discovery run from the Sources page."
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Recent changes"
            actions={
              <Link
                to="/admin/changes"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary-700 hover:underline"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            }
          />
          <CardBody>
            {recentChanges.length > 0 ? (
              <ul className="divide-y divide-neutral-100">
                {recentChanges.slice(0, 6).map((change) => (
                  <li key={change.id} className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-neutral-900">
                          {change.field} changed
                        </p>
                        <p className="mt-0.5 text-xs text-neutral-500">
                          Opportunity {change.opportunityId.slice(0, 8)}
                          {change.notified ? " · notified" : " · pending"}
                        </p>
                      </div>
                      <Badge tone={severityTone(change.severity)} size="sm">
                        {change.severity}
                      </Badge>
                    </div>
                    <p className="mt-1 text-[11px] text-neutral-400">
                      {formatRelative(change.detectedAt)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={<AlertTriangle className="h-6 w-6" />}
                title="No changes detected"
                description="Change events will appear as sources update."
              />
            )}
          </CardBody>
        </Card>
      </div>

      {/* Row 5 — Audit log + System status */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Recent audit log"
            actions={
              <Link
                to="/admin/audit-logs"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary-700 hover:underline"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            }
          />
          <CardBody>
            {recentAudit.length > 0 ? (
              <ul className="divide-y divide-neutral-100">
                {recentAudit.slice(0, 6).map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-start justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-neutral-900">
                        {entry.action}
                      </p>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        {entry.entityType ?? "system"}
                        {entry.entityId
                          ? ` · ${entry.entityId.slice(0, 8)}`
                          : ""}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] text-neutral-400">
                      {formatRelative(entry.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={<Activity className="h-6 w-6" />}
                title="No audit entries yet"
                description="Privileged actions will be recorded here."
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="System status" />
          <CardBody>
            <ul className="divide-y divide-neutral-100">
              <StatusRow
                label="Database"
                ok={systemStatus.dbOk}
                icon={<Database className="h-4 w-4" />}
              />
              <StatusRow
                label="Redis"
                ok={systemStatus.redisOk}
                icon={<Activity className="h-4 w-4" />}
              />
              <StatusRow
                label="Apify"
                ok={systemStatus.apifyConfigured}
                okLabel="Configured"
                failLabel="Not configured"
                icon={<PlayCircle className="h-4 w-4" />}
              />
              <StatusRow
                label="AI providers"
                ok={systemStatus.aiEnabled}
                okLabel="Enabled"
                failLabel="Disabled"
                icon={<Sparkles className="h-4 w-4" />}
              />
              <li className="flex items-center justify-between py-3">
                <span className="flex items-center gap-2 text-sm text-neutral-800">
                  <HeartPulse className="h-4 w-4 text-neutral-500" />
                  Queue depth
                </span>
                <span className="text-xs text-neutral-500">
                  {systemStatus.queueDepth ?? "—"}
                </span>
              </li>
              <li className="flex items-center justify-between py-3">
                <span className="flex items-center gap-2 text-sm text-neutral-800">
                  <Users className="h-4 w-4 text-neutral-500" />
                  Worker count
                </span>
                <span className="text-xs text-neutral-500">
                  {systemStatus.workerCount ?? "—"}
                </span>
              </li>
            </ul>
            <p className="mt-3 text-[11px] text-neutral-400">
              Last refreshed {formatRelative(new Date().toISOString())}
            </p>
          </CardBody>
        </Card>
      </div>
    </>
  );
}

function HealthRow({
  label,
  count,
  tone,
  icon,
}: {
  label: string;
  count: number;
  tone: "success" | "warning" | "danger" | "neutral";
  icon: React.ReactNode;
}) {
  const toneClasses: Record<string, string> = {
    success: "text-emerald-600",
    warning: "text-amber-600",
    danger: "text-red-600",
    neutral: "text-neutral-500",
  };
  return (
    <li className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm text-neutral-800">
        <span className={toneClasses[tone]}>{icon}</span>
        {label}
      </span>
      <span className="text-sm font-semibold text-neutral-900">{count}</span>
    </li>
  );
}

function StatusRow({
  label,
  ok,
  okLabel = "Operational",
  failLabel = "Down",
  icon,
}: {
  label: string;
  ok: boolean;
  okLabel?: string;
  failLabel?: string;
  icon: React.ReactNode;
}) {
  return (
    <li className="flex items-center justify-between py-3">
      <span className="flex items-center gap-2 text-sm text-neutral-800">
        <span className="text-neutral-500">{icon}</span>
        {label}
      </span>
      <Badge tone={ok ? "success" : "neutral"}>
        {ok ? okLabel : failLabel}
      </Badge>
    </li>
  );
}