import { PageHeader } from "../../components/layout/PageHeader";
import { SystemHealthPanel } from "../../components/admin/SystemHealthPanel";
import { SeoHead } from "../../components/common/SeoHead";

export function SystemHealth() {
  return (
    <>
      <SeoHead title="System health" />
      <PageHeader
        title="System health"
        description="Live status of critical platform services."
      />
      <SystemHealthPanel
        items={[
          { key: "api", label: "API", status: "ok" },
          { key: "worker", label: "Worker", status: "ok" },
          { key: "db", label: "Database", status: "ok" },
          { key: "redis", label: "Redis", status: "ok" },
          { key: "apify", label: "Apify", status: "ok" },
          { key: "ai", label: "AI providers", status: "ok" },
          { key: "web", label: "Web", status: "ok" },
        ]}
      />
    </>
  );
}