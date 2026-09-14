import { Check } from "lucide-react";
import { cn } from "../../utils/strings";

export interface StepperStep {
  id: string;
  label: string;
  description?: string;
}

export interface StepperProps {
  steps: StepperStep[];
  currentStep: number;
  onStepClick?: (index: number) => void;
  className?: string;
}

export function Stepper({ steps, currentStep, onStepClick, className }: StepperProps) {
  return (
    <ol className={cn("flex items-center gap-2", className)}>
      {steps.map((step, index) => {
        const complete = index < currentStep;
        const active = index === currentStep;
        const clickable = Boolean(onStepClick) && index <= currentStep;
        return (
          <li key={step.id} className="flex items-center gap-2 flex-1 min-w-0">
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onStepClick?.(index)}
              className={cn(
                "flex items-center gap-2 min-w-0",
                !clickable && "cursor-default",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  complete && "bg-primary-600 text-white",
                  active && "bg-primary-600 text-white ring-4 ring-primary-100",
                  !complete && !active && "bg-neutral-200 text-neutral-600",
                )}
              >
                {complete ? <Check aria-hidden className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <span className="hidden sm:block text-left min-w-0">
                <span
                  className={cn(
                    "block text-sm font-medium truncate",
                    active || complete ? "text-neutral-900" : "text-neutral-500",
                  )}
                >
                  {step.label}
                </span>
                {step.description ? (
                  <span className="block text-xs text-neutral-500 truncate">
                    {step.description}
                  </span>
                ) : null}
              </span>
            </button>
            {index < steps.length - 1 ? (
              <span
                aria-hidden
                className={cn(
                  "h-px flex-1 min-w-[8px]",
                  complete ? "bg-primary-600" : "bg-neutral-200",
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}