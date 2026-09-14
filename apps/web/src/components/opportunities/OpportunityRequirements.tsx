import type { OpportunityRequirement } from "../../types/opportunity";
import { Badge } from "../ui/Badge";
import { CheckCircle2, AlertCircle } from "lucide-react";

export interface OpportunityRequirementsProps {
  requirements: OpportunityRequirement[];
  emptyMessage?: string;
}

export function OpportunityRequirements({
  requirements,
  emptyMessage = "No requirements listed.",
}: OpportunityRequirementsProps) {
  if (requirements.length === 0) {
    return <p className="text-sm text-neutral-500">{emptyMessage}</p>;
  }

  return (
    <ul className="space-y-2">
      {requirements.map((requirement) => (
        <li
          key={requirement.id}
          className="flex items-start gap-2.5 rounded-lg border border-neutral-200 bg-white p-3"
        >
          {requirement.isMandatory ? (
            <AlertCircle aria-hidden className="mt-0.5 h-4 w-4 text-amber-500" />
          ) : (
            <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 text-emerald-500" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-neutral-900">
                {requirement.label}
              </p>
              {requirement.isMandatory ? (
                <Badge tone="warning" size="sm">Required</Badge>
              ) : (
                <Badge tone="neutral" size="sm">Optional</Badge>
              )}
              <Badge
                tone={requirement.source === "SOURCE_FACT" ? "neutral" : "info"}
                size="sm"
              >
                {requirement.source === "SOURCE_FACT" ? "From source" : "AI interpretation"}
              </Badge>
            </div>
            {requirement.description ? (
              <p className="mt-1 text-xs text-neutral-600">
                {requirement.description}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}