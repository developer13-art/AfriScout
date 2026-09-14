import { forwardRef, type InputHTMLAttributes } from "react";
import { Check } from "lucide-react";
import { cn } from "../../utils/strings";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  label?: string;
  description?: string;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, description, error, className, id, disabled, ...rest },
  ref,
) {
  const inputId = id ?? rest.name;
  return (
    <label
      htmlFor={inputId}
      className={cn(
        "flex items-start gap-3 select-none",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        className,
      )}
    >
      <span className="relative inline-flex h-5 w-5 mt-0.5 shrink-0">
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          disabled={disabled}
          className={cn(
            "peer h-5 w-5 appearance-none rounded border border-neutral-300 bg-white",
            "checked:bg-primary-600 checked:border-primary-600",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/40",
            error && "border-red-500",
          )}
          {...rest}
        />
        <Check
          aria-hidden
          className="pointer-events-none absolute inset-0 m-auto h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100"
        />
      </span>
      {(label || description) ? (
        <span className="min-w-0">
          {label ? (
            <span className="block text-sm font-medium text-neutral-800">{label}</span>
          ) : null}
          {description ? (
            <span className="block text-xs text-neutral-500 mt-0.5">{description}</span>
          ) : null}
          {error ? (
            <span className="block text-xs text-red-600 mt-0.5">{error}</span>
          ) : null}
        </span>
      ) : null}
    </label>
  );
});