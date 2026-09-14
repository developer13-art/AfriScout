import { forwardRef, type InputHTMLAttributes } from "react";
import { Search, X } from "lucide-react";
import { cn } from "../../utils/strings";

export interface SearchInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  onClear?: () => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput({ value, onClear, className, id, ...rest }, ref) {
    const hasValue = typeof value === "string" && value.length > 0;
    return (
      <div className={cn("relative w-full", className)}>
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
        />
        <input
          ref={ref}
          id={id}
          type="search"
          value={value}
          className={cn(
            "h-10 w-full rounded-lg border border-neutral-300 bg-white pl-9 pr-9 text-sm",
            "text-neutral-900 placeholder:text-neutral-400",
            "focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/30",
            "disabled:cursor-not-allowed disabled:bg-neutral-50",
          )}
          {...rest}
        />
        {hasValue && onClear ? (
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-neutral-500 hover:bg-neutral-100"
          >
            <X aria-hidden className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    );
  },
);