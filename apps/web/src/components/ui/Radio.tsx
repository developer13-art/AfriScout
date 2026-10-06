import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../../utils/strings";

export interface RadioProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  description?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { label, description, className, id, disabled, ...rest },
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
      <input
        ref={ref}
        id={inputId}
        type="radio"
        disabled={disabled}
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0 border-neutral-300 text-primary-600",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/40",
        )}
        {...rest}
      />
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