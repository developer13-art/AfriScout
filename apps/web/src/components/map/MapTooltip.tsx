import { cn } from "../../utils/strings";

export interface MapTooltipProps {
  label: string;
  value: string;
  x: number;
  y: number;
  className?: string;
}

export function MapTooltip({ label, value, x, y, className }: MapTooltipProps) {
  return (
    <div
      role="tooltip"
      className={cn(
        "pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-full rounded-md bg-neutral-900 px-2 py-1 text-xs text-white shadow-lg",
        className,
      )}
      style={{ left: x, top: y }}
    >
      <p className="font-semibold">{label}</p>
      <p className="text-white/80">{value}</p>
    </div>
  );
}