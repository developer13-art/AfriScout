import type { Opportunity } from "../../types/opportunity";
import { OpportunityCard } from "./OpportunityCard";
import { EmptyState } from "../ui/EmptyState";
import { Compass } from "lucide-react";

export interface OpportunityListProps {
  opportunities: Opportunity[];
  matchScores?: Record<string, number>;
  matchReasons?: Record<string, string[]>;
  savedIds?: Set<string>;
  onSave?: (opportunityId: string) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function OpportunityList({
  opportunities,
  matchScores,
  matchReasons,
  savedIds,
  onSave,
  emptyTitle = "No opportunities found",
  emptyDescription = "Try adjusting your filters or search terms.",
}: OpportunityListProps) {
  if (opportunities.length === 0) {
    return (
      <EmptyState
        icon={<Compass className="h-6 w-6" />}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="space-y-3">
      {opportunities.map((opportunity) => (
        <OpportunityCard
          key={opportunity.id}
          opportunity={opportunity}
          matchScore={matchScores?.[opportunity.id]}
          matchReasons={matchReasons?.[opportunity.id]}
          saved={savedIds?.has(opportunity.id)}
          onSave={onSave ? () => onSave(opportunity.id) : undefined}
          compact
        />
      ))}
    </div>
  );
}