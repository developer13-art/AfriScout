import { cn } from "../../utils/strings";
import { matchBand, matchBandLabel, matchScorePercent, matchTone } from "../../utils/matchScore";

export interface MatchScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const toneClasses = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  primary: "bg-teal-50 text-teal-700 ring-teal-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  danger: "bg-red-50 text-red-700 ring-red-200",
};

const sizeClasses = {
  sm: "h-6 px-2 text-[11px]",
  md: "h-7 px-2.5 text-xs",
  lg: "h-9 px-3 text-sm",
};

export function MatchScoreBadge({
  score,
  size = "md",
  className,
}: MatchScoreBadgeProps) {
  const band = matchBand(score);
  const tone = matchTone(band);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset",
        toneClasses[tone],
        sizeClasses[size],
        className,
      )}
      title={`${matchBandLabel(band)} match`}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {matchScorePercent(score)}
    </span>
  );
}