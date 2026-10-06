import { PageHeader } from "../../components/layout/PageHeader";
import { Loader } from "../../components/ui/Loader";
import { ErrorState } from "../../components/ui/ErrorState";
import { EmptyState } from "../../components/ui/EmptyState";
import { OpportunityCard } from "../../components/opportunities/OpportunityCard";
import { useMatches } from "../../hooks/useMatches";
import { Sparkles } from "lucide-react";
import { SeoHead } from "../../components/common/SeoHead";
import { matchBandLabel } from "../../utils/matchScore";
import { useDna } from "../../hooks/useDna";
import { Button } from "../../components/ui/Button";

export function Matches() {
  const matches = useMatches(200);
  const dna = useDna();

  return (
    <>
      <SeoHead title="Matches" />
      <PageHeader
        title="Matches"
        description="AI reviews available published opportunities against your Business DNA, explains the fit, and ranks qualified matches with explainable scores."
      />

      {matches.isLoading ? (
        <Loader fullPage label="Loading matches" />
      ) : matches.isError ? (
        <ErrorState title="Could not load matches" />
      ) : null}

      {!matches.isLoading && !matches.isError && matches.data?.aiAnalysisPending ? (
        <p className="mb-4 rounded-md bg-primary-50 p-3 text-sm text-primary-800" role="status">
          AI is analyzing your profile against published opportunities. Detailed
          match reasons will update automatically.
        </p>
      ) : null}

      {!matches.isLoading &&
      !matches.isError &&
      (matches.data?.aiAnalysisErrorCount ?? 0) > 0 ? (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          <p role="status">
            AI could not analyze {matches.data?.aiAnalysisErrorCount} opportunities.
            Check that a live AI provider key is configured, then retry.
          </p>
          <Button
            size="sm"
            variant="outline"
            loading={matches.recompute.isPending}
            onClick={() => matches.recompute.mutate()}
          >
            Retry analysis
          </Button>
        </div>
      ) : null}

      {!matches.isLoading && !matches.isError && (matches.data?.matches ?? []).length === 0 &&
      !matches.data?.aiAnalysisPending &&
      !(matches.data?.aiAnalysisErrorCount ?? 0) ? (
        <EmptyState
          icon={<Sparkles className="h-6 w-6" />}
          title="No matches yet"
          description={
            dna.data
              ? "We checked published opportunities against your DNA, but none are available as matches right now. Update your DNA or check back when new opportunities are published."
              : "Complete your Business DNA so we can find opportunities that fit."
          }
        />
      ) : null}

      {!matches.isLoading && !matches.isError && (matches.data?.matches ?? []).length > 0 ? (
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
                aiMatchReason={match.aiMatchReason}
                aiMatchProvider={match.aiMatchProvider}
                aiMatchError={match.aiMatchError}
              />
            );
          })}
        </div>
      ) : null}

      {matches.data?.matches[0] ? (
        <p className="mt-4 text-xs text-neutral-500">
          Highest band: {matchBandLabel(matches.data.matches[0]!.band)}
        </p>
      ) : null}
    </>
  );
}