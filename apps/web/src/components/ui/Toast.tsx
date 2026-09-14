import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, Info, TriangleAlert, X, AlertCircle } from "lucide-react";
import { cn } from "../../utils/strings";

export type ToastTone = "info" | "success" | "warning" | "danger";

export interface ToastOptions {
  id?: string;
  tone?: ToastTone;
  title: string;
  description?: string;
  durationMs?: number;
}

interface ToastRecord extends Required<Pick<ToastOptions, "id" | "tone" | "title">> {
  description?: string;
  durationMs: number;
}

interface ToastContextValue {
  show: (options: ToastOptions) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

const toneIcon: Record<ToastTone, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
  danger: AlertCircle,
};

const toneIconColor: Record<ToastTone, string> = {
  info: "text-sky-600",
  success: "text-emerald-600",
  warning: "text-amber-600",
  danger: "text-red-600",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback((options: ToastOptions) => {
    const id = options.id ?? crypto.randomUUID();
    const record: ToastRecord = {
      id,
      tone: options.tone ?? "info",
      title: options.title,
      description: options.description,
      durationMs: options.durationMs ?? 5000,
    };
    setToasts((prev) => [...prev, record]);
  }, []);

  const value = useMemo(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:right-4 sm:left-auto"
      >
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastRecord;
  onDismiss: (id: string) => void;
}) {
  const Icon = toneIcon[toast.tone];

  useEffect(() => {
    if (toast.durationMs <= 0) return;
    const timer = setTimeout(() => onDismiss(toast.id), toast.durationMs);
    return () => clearTimeout(timer);
  }, [toast.id, toast.durationMs, onDismiss]);

  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border border-neutral-200 bg-white p-3 shadow-lg animate-slide-up",
      )}
    >
      <Icon aria-hidden className={cn("mt-0.5 h-5 w-5", toneIconColor[toast.tone])} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-900">{toast.title}</p>
        {toast.description ? (
          <p className="mt-0.5 text-xs text-neutral-500">{toast.description}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100"
      >
        <X aria-hidden className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}