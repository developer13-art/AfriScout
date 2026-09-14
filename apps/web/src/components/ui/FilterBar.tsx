import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "../../utils/strings";

export interface FilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

export interface FilterBarProps {
  chips: FilterChip[];
  onClearAll?: () => void;
  rightSlot?: ReactNode;
  className?: string;
}

export function FilterBar({ chips, onClearAll, rightSlot, className }: FilterBarProps) {
  if (chips.length === 0 && !rightSlot) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50/60 px-3 py-2",
        className,
      )}
    >
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 ring-1 ring-neutral-200"
        >
          {chip.label}
          <button
            type="button"
            onClick={chip.onRemove}
            aria-label={`Remove filter ${chip.label}`}
            className="rounded-full p-0.5 text-neutral-500 hover:bg-neutral-100"
          >
            <X aria-hidden className="h-3 w-3" />
          </button>
        </span>
      ))}
      {chips.length > 0 && onClearAll ? (
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs font-medium text-primary-700 hover:underline"
        >
          Clear all
        </button>
      ) : null}
      <div className="ml-auto flex items-center gap-2">{rightSlot}</div>
    </div>
  );
}