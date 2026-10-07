import { Loader2 } from "lucide-react";
import { cn } from "../../utils/strings";

export type LoaderSize = "sm" | "md" | "lg";

export interface LoaderProps {
  size?: LoaderSize;
  label?: string;
  fullPage?: boolean;
  className?: string;
}

const sizes: Record<LoaderSize, string> = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export function Loader({ size = "md", label, fullPage, className }: LoaderProps) {
  if (fullPage) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 aria-hidden className={cn("animate-spin text-primary-600", sizes.lg)} />
        {label ? <p className="text-sm text-neutral-500">{label}</p> : null}
      </div>
    );
  }
  return (
    <div
      className={cn("inline-flex items-center gap-2 text-neutral-600", className)}
      role="status"
      aria-live="polite"
    >
      <Loader2 aria-hidden className={cn("animate-spin", sizes[size])} />
      {label ? <span className="text-sm">{label}</span> : null}
    </div>
  );
}