import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "../../utils/strings";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, leftIcon, rightIcon, className, id, ...rest },
  ref,
) {
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
        {leftIcon ? (
          <span
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
          >
            {leftIcon}
          </span>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "h-10 w-full rounded-lg border bg-white px-3 text-sm text-neutral-900",
            "placeholder:text-neutral-400",
            "focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/30",
            "disabled:cursor-not-allowed disabled:bg-neutral-50",
            leftIcon && "pl-9",
            rightIcon && "pr-9",
            error ? "border-red-500" : "border-neutral-300",
          )}
          aria-invalid={error ? true : undefined}
          {...rest}
        />
        {rightIcon ? (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500">
            {rightIcon}
          </span>
        ) : null}
      </div>
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-neutral-500">{hint}</p>
      ) : null}
    </div>
  );
});