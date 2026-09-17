import { Link } from "react-router-dom";
import { Card, CardHeader } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { Sparkles, ArrowRight } from "lucide-react";
import type { Opportunity } from "../../types/opportunity";
import { OpportunityCard } from "../opportunities/OpportunityCard";

export interface RecentMatch {
  opportunity: Opportunity;
  score: number;
  reasons?: string[];
}

export interface RecentMatchesProps {
  matches: RecentMatch[];
  onSave?: (opportunityId: string) => void;
  savedIds?: Set<string>;
}

export function RecentMatches({ matches, onSave, savedIds }: RecentMatchesProps) {
  return (
    <Card padding="md">
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            <Sparkles aria-hidden className="h-4 w-4 text-primary-600" />
            Top matches
          </span>
        }
        subtitle="Opportunities ranked against your Business DNA"
        actions={
          <Link
            to="/matches"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary-700 hover:underline"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        }
      />

      {matches.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="h-6 w-6" />}
          title="No matches yet"
          description="Complete your Business DNA so we can find opportunities that fit."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {matches.slice(0, 4).map(({ opportunity, score, reasons }) => (
            <OpportunityCard
              key={opportunity.id}
              opportunity={opportunity}
              matchScore={score}
              matchReasons={reasons}
              saved={savedIds?.has(opportunity.id)}
              onSave={onSave ? () => onSave(opportunity.id) : undefined}
            />
          ))}
        </div>
      )}
    </Card>
  );
}