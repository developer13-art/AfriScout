import type { AiAnalystResult } from "../../types/ai";
import { Card, CardHeader } from "../ui/Card";
import { AiSuggestionList } from "./AiSuggestionList";
import { AiDisclaimer } from "./AiDisclaimer";
import { Sparkles, ShieldAlert } from "lucide-react";
import { Button } from "../ui/Button";

export interface AiAnalystPanelProps {
  result?: AiAnalystResult | null;
  loading?: boolean;
  onRun?: () => void;
  error?: string | null;
}

export function AiAnalystPanel({ result, loading, onRun, error }: AiAnalystPanelProps) {
  const qualificationLabel = result
    ? {
        LIKELY: "Likely qualified from available evidence",
        POSSIBLE_GAPS: "Possible gaps to resolve",
        UNLIKELY: "Potential eligibility conflict",
        INSUFFICIENT_EVIDENCE: "Not enough evidence to assess",
      }[result.qualification]
    : "";

  return (
    <Card>
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            <Sparkles aria-hidden className="h-4 w-4 text-teal-600" />
            AI opportunity analyst
          </span>
        }
        actions={
          onRun ? (
            <Button size="sm" variant="outline" onClick={onRun} loading={loading}>
              {result ? "Re-run analysis" : "Analyze"}
            </Button>
          ) : null
        }
      />

      {!result ? (
        <div>
          <p className="text-sm text-neutral-500">
            Run an on-demand analysis for this opportunity using your profile.
            Your matches are ranked separately on the Matches page.
          </p>
          {error ? (
            <p className="mt-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          {error ? (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
            <p className="text-sm font-semibold text-neutral-900">
              {qualificationLabel}
            </p>
            <p className="mt-1 text-sm text-neutral-700">
              {result.qualificationReason}
            </p>
          </div>

          {result.match ? (
            <div className="rounded-lg border border-teal-100 p-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-semibold text-neutral-900">
                  Profile compatibility
                </p>
                <p className="text-sm font-semibold text-teal-800">
                  {result.match.score}% · {result.match.band.replaceAll("_", " ")}
                </p>
              </div>
              <ul className="mt-2 space-y-1 text-xs text-neutral-700">
                {result.match.breakdown.map((item) => (
                  <li key={item.label} className="flex justify-between gap-3">
                    <span>{item.label}</span>
                    <span>
                      {item.score}/{item.max}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-neutral-500">
                This deterministic score does not yet include reputation or
                on-chain evidence.
              </p>
            </div>
          ) : (
            <p className="text-xs text-neutral-500">
              No deterministic profile match is available yet.
            </p>
          )}

          <div className="rounded-lg border border-teal-100 bg-teal-50/40 p-3">
            <p className="text-sm font-semibold text-teal-800">
              Recommendation
            </p>
            <p className="mt-1 text-sm text-teal-900">{result.recommendation}</p>
          </div>

          <AiSuggestionList title="Strengths" items={result.strengths} />
          <AiSuggestionList
            title="Concerns"
            items={result.concerns}
            emptyMessage="No concerns highlighted."
          />
          <AiSuggestionList
            title="Missing requirements"
            items={result.missingRequirements}
            emptyMessage="No missing requirements identified."
          />
          <AiSuggestionList
            title="Credential evidence"
            items={result.credentialEvidence}
            emptyMessage="No matching verified credentials were found."
          />
          <AiSuggestionList title="Risk assessment" items={result.riskAssessment} />
          <AiSuggestionList
            title="Opportunity changes"
            items={result.opportunityChanges}
            emptyMessage="No recorded changes were found."
          />
          <AiSuggestionList
            title="Match explanation"
            items={result.matchExplanation}
            emptyMessage="No match explanation is available."
          />
          <AiSuggestionList title="Next steps" items={result.nextSteps} />

          <div className="grid grid-cols-2 gap-2 rounded-lg border border-neutral-200 p-3 text-xs text-neutral-700 sm:grid-cols-3">
            <p>Scout reputation: {result.context.reputationScore}</p>
            <p>On-chain credentials: {result.context.verifiedCredentialCount}</p>
            <p>Other achievements: {result.context.unanchoredAchievementCount}</p>
            <p>Completed opportunities: {result.context.completedOpportunityCount}</p>
            <p>Verified contributions: {result.context.verifiedContributionCount}</p>
            <p>Wallet verified: {result.context.walletVerified ? "Yes" : "No"}</p>
            <p>
              On-chain reward:{" "}
              {result.context.onChainRewardVerified ? "Verified" : "Not verified"}
            </p>
          </div>

          <div className="flex items-start gap-2 rounded-md bg-amber-50 p-3 text-xs text-amber-800">
            <ShieldAlert aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>
              This is decision support only, not a guarantee. The official source
              is authoritative.
            </p>
          </div>

          <AiDisclaimer />
          <p className="text-[11px] text-neutral-400">
            Provider: {result.provider} - Model: {result.model}
          </p>
        </div>
      )}
    </Card>
  );
}