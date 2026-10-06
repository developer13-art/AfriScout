import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../../utils/strings";

export interface SwitchProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  label?: string;
  description?: string;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { label, description, className, id, disabled, ...rest },
  ref,
) {
  const inputId = id ?? rest.name;
  return (
    <label
      htmlFor={inputId}
      className={cn(
        "inline-flex items-start gap-3 select-none",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        className,
      )}
    >
      <span className="relative inline-flex">
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          role="switch"
          disabled={disabled}
          className="peer sr-only"
          {...rest}
        />
        <span
          aria-hidden
          className={cn(
            "h-5 w-9 rounded-full bg-neutral-300 transition-colors",
            "peer-checked:bg-primary-600",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-primary-600/40",
          )}
        />
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
            "peer-checked:translate-x-4",
          )}
        />
      </span>
      {(label || description) ? (
        <span className="min-w-0">
          {label ? (
            <span className="block text-sm font-medium text-neutral-800">{label}</span>
          ) : null}
          {description ? (
            <span className="block text-xs text-neutral-500 mt-0.5">
              {description}
            </span>
          ) : null}
        </span>
      ) : null}
    </label>
  );
});