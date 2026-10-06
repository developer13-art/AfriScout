import type { MatchConcern } from "../../types/match";
import { AlertCircle } from "lucide-react";
import { cn } from "../../utils/strings";

export interface MatchConcernsProps {
  concerns: MatchConcern[];
}

const severityColor = {
  LOW: "text-amber-500",
  MEDIUM: "text-amber-600",
  HIGH: "text-red-500",
};

export function MatchConcerns({ concerns }: MatchConcernsProps) {
  if (concerns.length === 0) return null;

  return (
    <ul className="space-y-1.5">
      {concerns.map((concern) => (
        <li key={concern.key} className="flex items-start gap-2 text-xs">
          <AlertCircle
            aria-hidden
            className={cn(
              "mt-0.5 h-3.5 w-3.5 shrink-0",
              severityColor[concern.severity],
            )}
          />
          <span className="text-neutral-700">
            <span className="font-medium">{concern.label}</span>
            {concern.detail ? ` - ${concern.detail}` : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}