import type { MatchReason } from "../../types/match";
import { CheckCircle2 } from "lucide-react";

export interface MatchReasonsProps {
  reasons: MatchReason[];
}

export function MatchReasons({ reasons }: MatchReasonsProps) {
  if (reasons.length === 0) return null;

  return (
    <ul className="space-y-1.5">
      {reasons.map((reason) => (
        <li key={reason.key} className="flex items-start gap-2 text-xs">
          <CheckCircle2
            aria-hidden
            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500"
          />
          <span className="text-neutral-700">
            <span className="font-medium">{reason.label}</span>
            {reason.detail ? ` - ${reason.detail}` : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}