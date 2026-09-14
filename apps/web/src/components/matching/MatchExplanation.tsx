import type { Match, MatchBand } from "../../types/match";
import { Sparkles, Info } from "lucide-react";
import { matchBandLabel } from "../../utils/matchScore";

export interface MatchExplanationProps {
  match: Match;
}

export function MatchExplanation({ match }: MatchExplanationProps) {
  return (
    <div className="rounded-lg border border-teal-100 bg-teal-50/60 p-4">
      <div className="flex items-center gap-2">
        <Sparkles aria-hidden className="h-4 w-4 text-teal-700" />
        <p className="text-sm font-semibold text-teal-800">
          {match.score}% match - {matchBandLabel(match.band as MatchBand)}
        </p>
      </div>
      <p className="mt-2 text-xs text-teal-800">
        This score is computed from your Business DNA. It is not a decision -
        always review the opportunity details before pursuing it.
      </p>
      <div className="mt-3 flex items-start gap-1.5 text-[11px] text-teal-700">
        <Info aria-hidden className="mt-0.5 h-3 w-3" />
        Weights applied: {match.weightsVersion}
      </div>
    </div>
  );
}