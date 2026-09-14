import { cn } from "../../utils/strings";

export interface ProgressBarProps {
  value: number;
  max?: number;
  tone?: "primary" | "success" | "warning" | "danger";
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
}

const tones = {
  primary: "bg-primary-600",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
};

const sizes = {
  sm: "h-1.5",
  md: "h-2.5",
};

export function ProgressBar({
  value,
  max = 100,
  tone = "primary",
  size = "md",
  showLabel,
  className,
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "w-full overflow-hidden rounded-full bg-neutral-200",
          sizes[size],
        )}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
      >
        <div
          className={cn("h-full transition-all", tones[tone])}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel ? (
        <p className="mt-1 text-xs text-neutral-500">{Math.round(pct)}%</p>
      ) : null}
    </div>
  );
}