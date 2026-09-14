import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "../../utils/strings";

export type AlertTone = "info" | "success" | "warning" | "danger";

export interface AlertProps {
  tone?: AlertTone;
  title?: string;
  children?: ReactNode;
  onDismiss?: () => void;
  className?: string;
}

const toneClasses: Record<AlertTone, string> = {
  info: "border-info-500/20 bg-sky-50 text-sky-900",
  success: "border-emerald-500/20 bg-emerald-50 text-emerald-900",
  warning: "border-amber-500/20 bg-amber-50 text-amber-900",
  danger: "border-red-500/20 bg-red-50 text-red-900",
};

const toneIcon: Record<AlertTone, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
  danger: AlertCircle,
};

const toneIconColor: Record<AlertTone, string> = {
  info: "text-sky-600",
  success: "text-emerald-600",
  warning: "text-amber-600",
  danger: "text-red-600",
};

export function Alert({
  tone = "info",
  title,
  children,
  onDismiss,
  className,
}: AlertProps) {
  const Icon = toneIcon[tone];
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4",
        toneClasses[tone],
        className,
      )}
    >
      <Icon aria-hidden className={cn("mt-0.5 h-5 w-5 flex-shrink-0", toneIconColor[tone])} />
      <div className="flex-1 min-w-0">
        {title ? <div className="text-sm font-semibold">{title}</div> : null}
        {children ? <div className="text-sm mt-0.5">{children}</div> : null}
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="rounded-md p-1 text-neutral-500 hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/40"
        >
          <X aria-hidden className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}