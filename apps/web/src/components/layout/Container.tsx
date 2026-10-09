import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/strings";

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl" | "full";
  children: ReactNode;
}

const sizes = {
  sm: "max-w-2xl",
  md: "max-w-4xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  full: "max-w-none",
};

export function Container({
  size = "xl",
  className,
  children,
  ...rest
}: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        sizes[size],
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}