import { Info } from "lucide-react";

export interface OpportunityEligibilityProps {
  eligibility?: string | null;
  isAiGenerated?: boolean;
}

export function OpportunityEligibility({
  eligibility,
  isAiGenerated,
}: OpportunityEligibilityProps) {
  if (!eligibility) {
    return (
      <p className="text-sm text-neutral-500">
        No eligibility information available.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <p className="whitespace-pre-line text-sm text-neutral-700">
        {eligibility}
      </p>
      {isAiGenerated ? (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-neutral-500">
          <Info aria-hidden className="h-3.5 w-3.5" />
          This summary is AI-generated. Always verify against the official source.
        </p>
      ) : null}
    </div>
  );
}