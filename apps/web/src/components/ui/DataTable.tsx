import type { ReactNode } from "react";
import { cn } from "../../utils/strings";

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  align?: "left" | "right" | "center";
  width?: string;
  className?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyState?: ReactNode;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  emptyState,
  onRowClick,
  className,
}: DataTableProps<T>) {
  if (rows.length === 0 && emptyState) {
    return <div className={cn("py-8", className)}>{emptyState}</div>;
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-left">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                style={column.width ? { width: column.width } : undefined}
                className={cn(
                  "px-3 py-2.5 font-medium text-neutral-600 whitespace-nowrap",
                  column.align === "right" && "text-right",
                  column.align === "center" && "text-center",
                  column.className,
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const key = rowKey(row);
            const interactive = Boolean(onRowClick);
            return (
              <tr
                key={key}
                onClick={interactive ? () => onRowClick?.(row) : undefined}
                className={cn(
                  "border-b border-neutral-100 last:border-0",
                  interactive && "cursor-pointer hover:bg-neutral-50",
                )}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      "px-3 py-3 text-neutral-800 align-middle",
                      column.align === "right" && "text-right",
                      column.align === "center" && "text-center",
                      column.className,
                    )}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}