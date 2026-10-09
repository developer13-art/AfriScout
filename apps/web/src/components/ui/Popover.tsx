import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "../../utils/strings";

export interface PopoverProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: "left" | "right" | "center";
  side?: "top" | "bottom";
  className?: string;
}

export function Popover({
  trigger,
  children,
  align = "left",
  side = "bottom",
  className,
}: PopoverProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn("relative inline-block", className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="inline-flex"
      >
        {trigger}
      </button>
      {open ? (
        <div
          role="dialog"
          className={cn(
            "absolute z-40 min-w-[200px] rounded-lg border border-neutral-200 bg-white p-3 shadow-lg animate-fade-in",
            side === "bottom" ? "top-full mt-1" : "bottom-full mb-1",
            align === "left" && "left-0",
            align === "right" && "right-0",
            align === "center" && "left-1/2 -translate-x-1/2",
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}