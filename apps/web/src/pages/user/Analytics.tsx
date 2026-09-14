import { PageHeader } from "../../components/layout/PageHeader";
import { Card, CardHeader } from "../../components/ui/Card";
import { Loader } from "../../components/ui/Loader";
import { BarChart } from "../../components/charts/BarChart";
import { DonutChart } from "../../components/charts/DonutChart";
import { StatCard } from "../../components/dashboard/StatCard";
import { useBusinessAnalytics, useUserAnalytics } from "../../hooks/useAnalytics";
import { SeoHead } from "../../components/common/SeoHead";

export function Analytics() {
  const user = useUserAnalytics();
  const business = useBusinessAnalytics();

  if (user.isLoading || business.isLoading) {
    return <Loader fullPage label="Loading analytics" />;
  }

  return (
    <>
      <SeoHead title="Analytics" />
      <PageHeader title="Analytics" description="Performance across your pipeline." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Saved" value={user.data?.savedCount ?? 0} />
        <StatCard label="Watching" value={user.data?.watchlistCount ?? 0} />
        <StatCard label="In pipeline" value={user.data?.pipelineCount ?? 0} />
        <StatCard label="Win rate" value={`${Math.round((user.data?.winRate ?? 0) * 100)}%`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="By stage" />
          <BarChart
            data={(user.data?.byStage ?? []).map((s) => ({
              label: s.stage,
              value: s.count,
            }))}
          />
        </Card>
        <Card>
          <CardHeader title="Pipeline composition" />
          <DonutChart
            data={(user.data?.byStage ?? []).map((s, index) => ({
              label: s.stage,
              value: s.count,
              color: ["#0F766E", "#10B981", "#F59E0B", "#0EA5E9", "#E11D48"][
                index % 5
              ]!,
            }))}
          />
        </Card>
      </div>
    </>
  );
}