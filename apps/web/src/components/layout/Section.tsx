import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/strings";

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  title?: string;
  description?: string;
  actions?: ReactNode;
  spacing?: "sm" | "md" | "lg";
  children: ReactNode;
}

const spacings = {
  sm: "space-y-3",
  md: "space-y-5",
  lg: "space-y-8",
};

export function Section({
  title,
  description,
  actions,
  spacing = "md",
  className,
  children,
  ...rest
}: SectionProps) {
  return (
    <section className={cn(spacings[spacing], className)} {...rest}>
      {(title || description || actions) ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {title ? (
              <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
            ) : null}
            {description ? (
              <p className="mt-1 text-sm text-neutral-600">{description}</p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}