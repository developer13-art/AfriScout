import type { Opportunity } from "../../types/opportunity";
import { RadarSection } from "./RadarSection";
import { RadarFeed } from "./RadarFeed";

export interface RadarClosingSoonProps {
  opportunities: Opportunity[];
  matchScores?: Record<string, number>;
}

export function RadarClosingSoon({
  opportunities,
  matchScores,
}: RadarClosingSoonProps) {
  return (
    <RadarSection
      title="Closing soon"
      subtitle="Opportunities with deadlines in the next 14 days"
    >
      <RadarFeed
        opportunities={opportunities}
        matchScores={matchScores}
        emptyMessage="Nothing closing soon on your radar."
      />
    </RadarSection>
  );
}