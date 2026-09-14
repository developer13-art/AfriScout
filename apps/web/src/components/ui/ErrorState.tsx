import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "../../utils/strings";

export interface ErrorStateProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  description,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-6",
        className,
      )}
      role="alert"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
        <AlertCircle aria-hidden className="h-7 w-7" />
      </div>
      <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-md text-sm text-neutral-500">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}