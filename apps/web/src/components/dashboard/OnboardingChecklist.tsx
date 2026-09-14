import { Link } from "react-router-dom";
import { Card, CardHeader } from "../ui/Card";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { cn } from "../../utils/strings";

export interface OnboardingStep {
  id: string;
  label: string;
  description?: string;
  completed: boolean;
  to?: string;
}

export interface OnboardingChecklistProps {
  steps: OnboardingStep[];
}

export function OnboardingChecklist({ steps }: OnboardingChecklistProps) {
  const completed = steps.filter((step) => step.completed).length;
  const total = steps.length;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <Card>
      <CardHeader
        title="Get started"
        subtitle={`${completed} of ${total} steps completed`}
      />
      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
        <div
          className="h-full bg-primary-600 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <ul className="space-y-2">
        {steps.map((step) => (
          <li
            key={step.id}
            className={cn(
              "flex items-start gap-2.5 rounded-lg border p-3",
              step.completed
                ? "border-emerald-100 bg-emerald-50/40"
                : "border-neutral-200 bg-white",
            )}
          >
            {step.completed ? (
              <CheckCircle2
                aria-hidden
                className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
              />
            ) : (
              <Circle
                aria-hidden
                className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-neutral-800">{step.label}</p>
              {step.description ? (
                <p className="mt-0.5 text-xs text-neutral-500">
                  {step.description}
                </p>
              ) : null}
            </div>
            {!step.completed && step.to ? (
              <Link
                to={step.to}
                className="inline-flex h-7 items-center gap-1 rounded-md border border-neutral-300 px-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 shrink-0"
              >
                Open <ArrowRight className="h-3 w-3" />
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </Card>
  );
}