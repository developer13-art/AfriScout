import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Fragment } from "react";
import { cn } from "../../utils/strings";

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  if (!items.length) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn("text-sm", className)}>
      <ol className="flex items-center flex-wrap gap-1.5 text-neutral-600">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <Fragment key={`${item.label}-${index}`}>
              <li>
                {isLast || !item.to ? (
                  <span
                    aria-current={isLast ? "page" : undefined}
                    className={cn(
                      "text-neutral-700",
                      isLast && "font-medium text-neutral-900",
                    )}
                  >
                    {item.label}
                  </span>
                ) : (
                  <Link
                    to={item.to}
                    className="hover:text-primary-700 hover:underline"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
              {!isLast ? (
                <li aria-hidden className="text-neutral-400">
                  <ChevronRight className="h-3.5 w-3.5" />
                </li>
              ) : null}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}