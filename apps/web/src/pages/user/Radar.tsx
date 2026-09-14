import { PageHeader } from "../../components/layout/PageHeader";
import { Loader } from "../../components/ui/Loader";
import { ErrorState } from "../../components/ui/ErrorState";
import { RadarClosingSoon } from "../../components/radar/RadarClosingSoon";
import { RadarNewlyUpdated } from "../../components/radar/RadarNewlyUpdated";
import { RadarSection } from "../../components/radar/RadarSection";
import { RadarFeed } from "../../components/radar/RadarFeed";
import { useRadar } from "../../hooks/useRadar";
import { SeoHead } from "../../components/common/SeoHead";

export function Radar() {
  const radar = useRadar();

  return (
    <>
      <SeoHead title="Opportunity Radar" />
      <PageHeader
        title="Opportunity Radar"
        description="A personalized feed of what matters to you right now."
      />

      {radar.isLoading ? (
        <Loader fullPage label="Loading radar" />
      ) : radar.isError ? (
        <ErrorState title="Could not load radar" />
      ) : (
        <div className="space-y-6">
          <RadarSection
            title="Strong matches"
            subtitle="Top scores against your Business DNA"
          >
            <RadarFeed opportunities={radar.data?.strongMatches.map((m) => m as never) ?? []} />
          </RadarSection>
          <RadarSection
            title="New opportunities"
            subtitle="Recently discovered across your interests"
          >
            <RadarFeed opportunities={radar.data?.newOpportunities ?? []} />
          </RadarSection>
          <RadarClosingSoon opportunities={radar.data?.closingSoon ?? []} />
          <RadarNewlyUpdated opportunities={radar.data?.recentlyUpdated ?? []} />
        </div>
      )}
    </>
  );
}