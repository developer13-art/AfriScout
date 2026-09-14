import { PageHeader } from "../../components/layout/PageHeader";
import { Loader } from "../../components/ui/Loader";
import { ErrorState } from "../../components/ui/ErrorState";
import { EmptyState } from "../../components/ui/EmptyState";
import { OpportunityCard } from "../../components/opportunities/OpportunityCard";
import { useMatches } from "../../hooks/useMatches";
import { Sparkles } from "lucide-react";
import { SeoHead } from "../../components/common/SeoHead";
import { matchBandLabel } from "../../utils/matchScore";

export function Matches() {
  const matches = useMatches();

  return (
    <>
      <SeoHead title="Matches" />
      <PageHeader
        title="Matches"
        description="Opportunities ranked against your Business DNA with explainable scores."
      />

      {matches.isLoading ? (
        <Loader fullPage label="Loading matches" />
      ) : matches.isError ? (
        <ErrorState title="Could not load matches" />
      ) : (matches.data?.matches ?? []).length === 0 ? (
        <EmptyState
          icon={<Sparkles className="h-6 w-6" />}
          title="No matches yet"
          description="Complete your Business DNA so we can find opportunities that fit."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {matches.data!.matches.map((match) => {
            const opportunity = matches.data!.opportunities[match.opportunityId];
            if (!opportunity) return null;
            return (
              <OpportunityCard
                key={match.id}
                opportunity={opportunity}
                matchScore={match.score}
                matchReasons={match.reasons.map(
                  (r) => `${r.label}${r.detail ? ` - ${r.detail}` : ""}`,
                )}
              />
            );
          })}
        </div>
      )}

      {matches.data?.matches[0] ? (
        <p className="mt-4 text-xs text-neutral-500">
          Highest band: {matchBandLabel(matches.data.matches[0]!.band)}
        </p>
      ) : null}
    </>
  );
}