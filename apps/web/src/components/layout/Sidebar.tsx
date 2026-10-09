import type { ReactNode } from "react";
import { cn } from "../../utils/strings";

export interface SidebarProps {
  header?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  width?: "sm" | "md" | "lg";
}

const widths = {
  sm: "w-56",
  md: "w-64",
  lg: "w-72",
};

export function Sidebar({
  header,
  children,
  footer,
  className,
  width = "md",
}: SidebarProps) {
  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-neutral-200 bg-white",
        widths[width],
        className,
      )}
    >
      {header ? (
        <div className="border-b border-neutral-100 px-4 py-4">{header}</div>
      ) : null}
      <nav className="flex-1 overflow-y-auto px-2 py-3">{children}</nav>
      {footer ? (
        <div className="border-t border-neutral-100 px-4 py-3">{footer}</div>
      ) : null}
    </aside>
  );
}