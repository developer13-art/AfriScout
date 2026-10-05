import type { Opportunity } from "../../types/opportunity";
import { OpportunityCompactRow } from "../opportunities/OpportunityCompactRow";
import { EmptyState } from "../ui/EmptyState";
import { Radar } from "lucide-react";

export interface RadarFeedProps {
  opportunities: Opportunity[];
  matchScores?: Record<string, number>;
  emptyMessage?: string;
}

export function RadarFeed({
  opportunities,
  matchScores,
  emptyMessage = "No opportunities on your radar yet.",
}: RadarFeedProps) {
  if (opportunities.length === 0) {
    return (
      <EmptyState
        icon={<Radar className="h-6 w-6" />}
        title="Radar is empty"
        description={emptyMessage}
      />
    );
  }

  return (
    <ul className="divide-y divide-neutral-100">
      {opportunities.map((opportunity) => (
        <li key={opportunity.id}>
          <OpportunityCompactRow
            opportunity={opportunity}
            matchScore={matchScores?.[opportunity.id]}
          />
        </li>
      ))}
    </ul>
  );
}