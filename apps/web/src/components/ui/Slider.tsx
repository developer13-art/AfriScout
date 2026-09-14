import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../../utils/strings";

export interface SliderProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  hint?: string;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(function Slider(
  { label, hint, className, id, ...rest },
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
      <input
        ref={ref}
        id={inputId}
        type="range"
        className={cn(
          "h-2 w-full cursor-pointer appearance-none rounded-full bg-neutral-200",
          "accent-primary-600",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/40",
        )}
        {...rest}
      />
      {hint ? <p className="mt-1 text-xs text-neutral-500">{hint}</p> : null}
    </div>
  );
});