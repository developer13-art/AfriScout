import { forwardRef, type InputHTMLAttributes } from "react";
import { Calendar } from "lucide-react";
import { cn } from "../../utils/strings";

export interface DatePickerProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
  hint?: string;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  function DatePicker({ label, error, hint, className, id, ...rest }, ref) {
    const inputId = id ?? rest.name;
    return (
      <div className={cn("w-full", className)}>
        {label ? (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-neutral-700"
          >
            {label}
          </label>
        ) : null}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type="date"
            className={cn(
              "h-10 w-full rounded-lg border bg-white pl-9 pr-3 text-sm text-neutral-900",
              "placeholder:text-neutral-400",
              "focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/30",
              error ? "border-red-500" : "border-neutral-300",
              "disabled:cursor-not-allowed disabled:bg-neutral-50",
            )}
            {...rest}
          />
          <Calendar
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
          />
        </div>
        {error ? (
          <p className="mt-1 text-xs text-red-600">{error}</p>
        ) : hint ? (
          <p className="mt-1 text-xs text-neutral-500">{hint}</p>
        ) : null}
      </div>
    );
  },
);