import type { Opportunity } from "../../types/opportunity";
import { RadarSection } from "./RadarSection";
import { RadarFeed } from "./RadarFeed";

export interface RadarNewlyUpdatedProps {
  opportunities: Opportunity[];
  matchScores?: Record<string, number>;
}

export function RadarNewlyUpdated({
  opportunities,
  matchScores,
}: RadarNewlyUpdatedProps) {
  return (
    <RadarSection
      title="Recently updated"
      subtitle="Opportunities whose source information changed"
    >
      <RadarFeed
        opportunities={opportunities}
        matchScores={matchScores}
        emptyMessage="No recent updates on your radar."
      />
    </RadarSection>
  );
}