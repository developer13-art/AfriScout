import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { AppLogo } from "../common/AppLogo";
import { IconButton } from "../ui/IconButton";

export interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function MobileNav({ open, onClose, children }: MobileNavProps) {
  const { pathname } = useLocation();

  useEffect(() => {
    if (open) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-neutral-900/50 animate-fade-in"
        onClick={onClose}
      />
      <div className="absolute inset-y-0 left-0 flex w-72 max-w-full flex-col bg-white shadow-xl animate-slide-up">
        <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
          <Link to="/" onClick={onClose} aria-label="AfriScout home">
            <AppLogo />
          </Link>
          <IconButton
            icon={<X className="h-4 w-4" />}
            label="Close navigation"
            tone="ghost"
            size="sm"
            onClick={onClose}
          />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}