import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "../../utils/strings";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, error, hint, className, id, rows = 4, ...rest }, ref) {
    const textareaId = id ?? rest.name;
    return (
      <div className={cn("w-full", className)}>
        {label ? (
          <label
            htmlFor={textareaId}
            className="mb-1.5 block text-sm font-medium text-neutral-700"
          >
            {label}
          </label>
        ) : null}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={cn(
            "w-full rounded-lg border bg-white px-3 py-2 text-sm text-neutral-900",
            "placeholder:text-neutral-400",
            "focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/30",
            "disabled:cursor-not-allowed disabled:bg-neutral-50",
            "resize-y",
            error ? "border-red-500" : "border-neutral-300",
          )}
          aria-invalid={error ? true : undefined}
          {...rest}
        />
        {error ? (
          <p className="mt-1 text-xs text-red-600">{error}</p>
        ) : hint ? (
          <p className="mt-1 text-xs text-neutral-500">{hint}</p>
        ) : null}
      </div>
    );
  },
);