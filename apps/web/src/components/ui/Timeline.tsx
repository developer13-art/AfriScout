import type { ReactNode } from "react";
import { cn } from "../../utils/strings";

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  timestamp?: string;
  icon?: ReactNode;
  tone?: "default" | "primary" | "success" | "warning" | "danger";
}

const toneDot = {
  default: "bg-neutral-300",
  primary: "bg-primary-600",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
};

export interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export function Timeline({ items, className }: TimelineProps) {
  if (items.length === 0) return null;

  return (
    <ol className={cn("relative space-y-4", className)}>
      {items.map((item, index) => (
        <li key={item.id} className="relative pl-8">
          <span
            aria-hidden
            className={cn(
              "absolute left-2.5 top-2 h-2 w-2 rounded-full ring-4 ring-white",
              toneDot[item.tone ?? "default"],
            )}
          />
          {index < items.length - 1 ? (
            <span
              aria-hidden
              className="absolute left-[13px] top-4 h-full w-px bg-neutral-200"
            />
          ) : null}
          <div>
            <div className="flex items-center gap-2">
              {item.icon ? (
                <span className="text-neutral-500" aria-hidden>
                  {item.icon}
                </span>
              ) : null}
              <p className="text-sm font-medium text-neutral-900">{item.title}</p>
            </div>
            {item.description ? (
              <p className="mt-0.5 text-xs text-neutral-500">{item.description}</p>
            ) : null}
            {item.timestamp ? (
              <p className="mt-0.5 text-[11px] uppercase tracking-wide text-neutral-400">
                {item.timestamp}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}