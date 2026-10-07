import type { ReactNode } from "react";
import { cn } from "../../utils/strings";

export interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: "default" | "primary" | "success" | "warning" | "danger";
  className?: string;
}

const toneBg = {
  default: "bg-neutral-100 text-neutral-600",
  primary: "bg-teal-50 text-teal-700",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
};

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-neutral-200 bg-white p-4 shadow-sm",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            {label}
          </p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900">{value}</p>
          {hint ? <p className="mt-1 text-xs text-neutral-500">{hint}</p> : null}
        </div>
        {icon ? (
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
              toneBg[tone],
            )}
            aria-hidden
          >
            {icon}
          </span>
        ) : null}
      </div>
    </div>
  );
}