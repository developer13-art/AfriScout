import type { ReactNode } from "react";
import { cn } from "../../utils/strings";

export interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return <div className={cn("animate-fade-in", className)}>{children}</div>;
}