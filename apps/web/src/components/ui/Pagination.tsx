import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../utils/strings";

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  className,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-3 pt-3",
        className,
      )}
    >
      <p className="text-xs text-neutral-500">
        Showing <span className="font-medium text-neutral-700">{start}</span>-
        <span className="font-medium text-neutral-700">{end}</span> of{" "}
        <span className="font-medium text-neutral-700">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => canPrev && onPageChange(page - 1)}
          disabled={!canPrev}
          className={cn(
            "inline-flex h-8 items-center gap-1 rounded-md px-2 text-sm",
            "border border-neutral-300 bg-white text-neutral-700",
            "hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          <ChevronLeft aria-hidden className="h-4 w-4" />
          Previous
        </button>
        <span className="px-2 text-xs text-neutral-500">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => canNext && onPageChange(page + 1)}
          disabled={!canNext}
          className={cn(
            "inline-flex h-8 items-center gap-1 rounded-md px-2 text-sm",
            "border border-neutral-300 bg-white text-neutral-700",
            "hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          Next
          <ChevronRight aria-hidden className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}