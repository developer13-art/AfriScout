import { Link } from "react-router-dom";
import { Bell, Bookmark, Sparkles, Workflow } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { StatCard } from "../../components/dashboard/StatCard";
import { RecentMatches } from "../../components/dashboard/RecentMatches";
import { DeadlineWidget } from "../../components/dashboard/DeadlineWidget";
import { PipelineSummary } from "../../components/dashboard/PipelineSummary";
import { CategoryBreakdown } from "../../components/dashboard/CategoryBreakdown";
import { OnboardingChecklist } from "../../components/dashboard/OnboardingChecklist";
import { Button } from "../../components/ui/Button";
import { Loader } from "../../components/ui/Loader";
import { useUser } from "../../hooks/useUser";
import { useRadar } from "../../hooks/useRadar";
import { useMatches } from "../../hooks/useMatches";
import { usePipeline } from "../../hooks/usePipeline";
import { useSaved } from "../../hooks/useSaved";
import { useDna } from "../../hooks/useDna";
import { labelForCategory } from "../../config/categories";
import { SeoHead } from "../../components/common/SeoHead";
import { pipelineStageLabel } from "../../components/pipeline/PipelineStatusBadge";

export function Dashboard() {
  const { user } = useUser();
  const radar = useRadar();
  const matches = useMatches(6);
  const pipeline = usePipeline();
  const saved = useSaved();
  const dna = useDna();

  const recentMatches = (matches.data?.matches ?? [])
    .slice(0, 5)
    .map((m) => ({
      opportunity: matches.data?.opportunities[m.opportunityId],
      score: m.score,
    }))
    .filter((entry) => Boolean(entry.opportunity)) as {
    opportunity: NonNullable<typeof matches.data>["opportunities"][string];
    score: number;
  }[];

  const pipelineStages = Object.entries(
    (pipeline.data ?? []).reduce<Record<string, number>>((acc, item) => {
      acc[item.stage] = (acc[item.stage] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([stage, count]) => ({
    stage,
    label: pipelineStageLabel(stage as never),
    count,
  }));

  const categorySlices = (radar.data?.newOpportunities ?? [])
    .reduce<Record<string, number>>((acc, opp) => {
      acc[opp.category] = (acc[opp.category] ?? 0) + 1;
      return acc;
    }, {});
  const categorySlicesArray = Object.entries(categorySlices).map(
    ([key, count]) => ({
      key,
      label: labelForCategory(key),
      count,
    }),
  );

  const onboarded = Boolean(dna.data);

  return (
    <>
      <SeoHead title="Dashboard" />
      <PageHeader
        title={`Good day, ${user?.fullName.split(" ")[0] ?? "there"}`}
        description="Here is what is happening with your opportunities."
        actions={
          <Link to="/explore">
            <Button>Explore opportunities</Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="New opportunities"
          value={radar.data?.newOpportunities.length ?? 0}
          icon={<Sparkles className="h-4 w-4" />}
          tone="primary"
        />
        <StatCard
          label="Matches"
          value={matches.data?.matches.length ?? 0}
          icon={<Sparkles className="h-4 w-4" />}
          tone="success"
        />
        <StatCard
          label="Saved"
          value={saved.data?.length ?? 0}
          icon={<Bookmark className="h-4 w-4" />}
        />
        <StatCard
          label="Pipeline"
          value={pipeline.data?.length ?? 0}
          icon={<Workflow className="h-4 w-4" />}
          tone="warning"
        />
      </div>

      {!onboarded ? (
        <div className="mt-6">
          <OnboardingChecklist
            steps={[
              {
                id: "dna",
                label: "Complete your Business DNA",
                description: "Tell us what you do so we can match you accurately.",
                completed: false,
                to: "/dna",
              },
              {
                id: "explore",
                label: "Explore opportunities",
                description: "Browse opportunities across Africa.",
                completed: true,
                to: "/explore",
              },
              {
                id: "pipeline",
                label: "Add your first opportunity to the pipeline",
                description: "Track opportunities through to outcome.",
                completed: false,
                to: "/pipeline",
              },
            ]}
          />
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {matches.isLoading ? (
            <Loader label="Loading matches" />
          ) : (
            <RecentMatches matches={recentMatches} />
          )}
          {radar.isLoading ? (
            <Loader label="Loading radar" />
          ) : (
            <DeadlineWidget opportunities={radar.data?.closingSoon ?? []} />
          )}
        </div>
        <div className="space-y-6">
          <PipelineSummary stages={pipelineStages} />
          <CategoryBreakdown slices={categorySlicesArray} />
        </div>
      </div>
    </>
  );
}