import { PageHeader } from "../../components/layout/PageHeader";
import { StatCard } from "../../components/dashboard/StatCard";
import { SystemHealthPanel } from "../../components/admin/SystemHealthPanel";
import { Loader } from "../../components/ui/Loader";
import { useAdminAnalytics } from "../../hooks/useAnalytics";
import { Database, Layers, AlertTriangle, Activity } from "lucide-react";
import { SeoHead } from "../../components/common/SeoHead";

export function Dashboard() {
  const analytics = useAdminAnalytics();

  if (analytics.isLoading) return <Loader fullPage label="Loading admin dashboard" />;

  const data = analytics.data;

  return (
    <>
      <SeoHead title="Admin dashboard" />
      <PageHeader title="Admin dashboard" description="System overview" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Sources"
          value={data?.sourcesTotal ?? 0}
          hint={`${data?.sourcesHealthy ?? 0} healthy`}
          icon={<Database className="h-4 w-4" />}
          tone="primary"
        />
        <StatCard
          label="Opportunities"
          value={data?.opportunitiesTotal ?? 0}
          hint={`${data?.opportunitiesPublished ?? 0} published`}
          icon={<Layers className="h-4 w-4" />}
        />
        <StatCard
          label="Duplicates pending"
          value={data?.duplicatesPending ?? 0}
          icon={<AlertTriangle className="h-4 w-4" />}
          tone="warning"
        />
        <StatCard
          label="Changes (24h)"
          value={data?.changesLast24h ?? 0}
          icon={<Activity className="h-4 w-4" />}
          tone="success"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SystemHealthPanel
          items={[
            {
              key: "db",
              label: "Database",
              status: "ok",
            },
            {
              key: "redis",
              label: "Redis",
              status: "ok",
            },
            {
              key: "apify",
              label: "Apify",
              status: data?.actorRunsFailedLast24h ? "degraded" : "ok",
              detail: `${data?.actorRunsLast24h ?? 0} runs in last 24h`,
            },
            {
              key: "ai",
              label: "AI providers",
              status: "ok",
            },
          ]}
        />
      </div>
    </>
  );
}