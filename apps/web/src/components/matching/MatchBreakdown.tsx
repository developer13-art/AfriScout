import type { MatchBreakdownItem } from "../../types/match";
import { cn } from "../../utils/strings";

export interface MatchBreakdownProps {
  breakdown: MatchBreakdownItem[];
  className?: string;
}

export function MatchBreakdown({ breakdown, className }: MatchBreakdownProps) {
  if (breakdown.length === 0) return null;

  return (
    <ul className={cn("space-y-2.5", className)}>
      {breakdown.map((item) => {
        const pct = Math.round((item.score / item.max) * 100);
        return (
          <li key={item.key}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-neutral-700">{item.label}</span>
              <span className="text-neutral-500">
                {item.score}/{item.max}
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
              <div
                className={cn(
                  "h-full transition-all",
                  pct >= 80
                    ? "bg-emerald-500"
                    : pct >= 55
                      ? "bg-primary-600"
                      : pct >= 35
                        ? "bg-amber-500"
                        : "bg-red-500",
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
            {item.reason ? (
              <p className="mt-0.5 text-[11px] text-neutral-500">{item.reason}</p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}