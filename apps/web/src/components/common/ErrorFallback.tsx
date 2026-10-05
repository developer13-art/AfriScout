import { AlertCircle } from "lucide-react";
import { Button } from "../ui/Button";

export interface ErrorFallbackProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorFallback({
  title = "Something went wrong",
  description = "An unexpected error occurred.",
  onRetry,
}: ErrorFallbackProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
          <AlertCircle aria-hidden className="h-7 w-7" />
        </div>
        <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
        <p className="mt-1 text-sm text-neutral-500">{description}</p>
        {onRetry ? (
          <div className="mt-5">
            <Button onClick={onRetry}>Try again</Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}