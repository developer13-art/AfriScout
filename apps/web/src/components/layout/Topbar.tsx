import type { ReactNode } from "react";
import { cn } from "../../utils/strings";

export interface TopbarProps {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
  className?: string;
}

export function Topbar({ left, center, right, className }: TopbarProps) {
  return (
    <div
      className={cn(
        "flex h-14 items-center gap-3 border-b border-neutral-200 bg-white px-4",
        className,
      )}
    >
      {left ? <div className="flex min-w-0 items-center gap-2">{left}</div> : null}
      {center ? (
        <div className="mx-auto hidden max-w-md flex-1 lg:block">{center}</div>
      ) : null}
      {right ? (
        <div className="ml-auto flex items-center gap-2">{right}</div>
      ) : null}
    </div>
  );
}