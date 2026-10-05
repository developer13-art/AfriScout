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
  aiMatchReason?: string | null;
  aiMatchProvider?: string | null;
  aiMatchError?: string | null;
}

export interface RecentMatchesProps {
  matches: RecentMatch[];
  onSave?: (opportunityId: string) => void;
  savedIds?: Set<string>;
  emptyDescription?: string;
  analyzing?: boolean;
  analysisErrorCount?: number;
}

export function RecentMatches({
  matches,
  onSave,
  savedIds,
  emptyDescription,
  analyzing,
  analysisErrorCount,
}: RecentMatchesProps) {
  return (
    <Card padding="md">
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            <Sparkles aria-hidden className="h-4 w-4 text-primary-600" />
            Top matches
          </span>
        }
        subtitle="AI-qualified opportunities ranked by your Business DNA score"
        actions={
          <Link
            to="/matches"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary-700 hover:underline"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        }
      />

      {matches.length > 0 && analyzing ? (
        <p className="mb-3 text-xs text-neutral-600" role="status">
          AI is still preparing detailed reasons for some matches.
        </p>
      ) : null}

      {(analysisErrorCount ?? 0) > 0 ? (
        <p className="mb-3 text-xs text-amber-800" role="status">
          AI could not analyze {analysisErrorCount} opportunities. Check the API
          provider configuration.
        </p>
      ) : null}

      {matches.length === 0 && analyzing ? (
        <p className="py-4 text-sm text-neutral-600" role="status">
          AI is analyzing your profile against published opportunities.
        </p>
      ) : matches.length === 0 && (analysisErrorCount ?? 0) > 0 ? null : matches.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="h-6 w-6" />}
          title="No matches yet"
          description={
            emptyDescription ??
            "Complete your Business DNA so we can find opportunities that fit."
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {matches.slice(0, 4).map(
            ({
              opportunity,
              score,
              reasons,
              aiMatchReason,
              aiMatchProvider,
              aiMatchError,
            }) => (
              <OpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                matchScore={score}
                matchReasons={reasons}
                aiMatchReason={aiMatchReason}
                aiMatchProvider={aiMatchProvider}
                aiMatchError={aiMatchError}
                saved={savedIds?.has(opportunity.id)}
                onSave={onSave ? () => onSave(opportunity.id) : undefined}
              />
            ),
          )}
        </div>
      )}
    </Card>
  );
}