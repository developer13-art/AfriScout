import type { ReactNode } from "react";
import { cn } from "../../utils/strings";

export type BadgeTone =
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "accent";

export type BadgeSize = "sm" | "md";

export interface BadgeProps {
  tone?: BadgeTone;
  size?: BadgeSize;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-neutral-100 text-neutral-700 ring-neutral-200",
  primary: "bg-teal-50 text-teal-700 ring-teal-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  danger: "bg-red-50 text-red-700 ring-red-200",
  info: "bg-sky-50 text-sky-700 ring-sky-200",
  accent: "bg-amber-100 text-amber-800 ring-amber-300",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "h-5 px-2 text-[11px] gap-1",
  md: "h-6 px-2.5 text-xs gap-1.5",
};

export function Badge({
  tone = "neutral",
  size = "sm",
  icon,
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium ring-1 ring-inset whitespace-nowrap",
        sizeClasses[size],
        toneClasses[tone],
        className,
      )}
    >
      {icon ? <span className="shrink-0" aria-hidden>{icon}</span> : null}
      <span>{children}</span>
    </span>
  );
}