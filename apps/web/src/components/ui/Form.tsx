import type { FormHTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/strings";

export interface FormProps extends FormHTMLAttributes<HTMLFormElement> {
  children: ReactNode;
}

export function Form({ children, className, ...rest }: FormProps) {
  return (
    <form className={cn("space-y-4", className)} noValidate {...rest}>
      {children}
    </form>
  );
}

export function FormRow({
  children,
  columns = 1,
  className,
}: {
  children: ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}) {
  const cols =
    columns === 1 ? "grid-cols-1" : columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3";
  return <div className={cn("grid gap-4", cols, className)}>{children}</div>;
}

export function FormActions({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-end gap-2 pt-2", className)}>
      {children}
    </div>
  );
}

export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      {title ? (
        <div>
          <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
          {description ? (
            <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
          ) : null}
        </div>
      ) : null}
      <div className="space-y-4">{children}</div>
    </section>
  );
}