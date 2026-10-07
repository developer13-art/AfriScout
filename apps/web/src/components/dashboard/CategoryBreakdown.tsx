import { Card, CardHeader } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { PieChart } from "lucide-react";

export interface CategorySlice {
  key: string;
  label: string;
  count: number;
  colorClass?: string;
}

export interface CategoryBreakdownProps {
  slices: CategorySlice[];
  title?: string;
}

const defaultColors = [
  "bg-primary-600",
  "bg-secondary-500",
  "bg-amber-500",
  "bg-sky-500",
  "bg-rose-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-neutral-400",
];

export function CategoryBreakdown({
  slices,
  title = "By category",
}: CategoryBreakdownProps) {
  const total = slices.reduce((sum, slice) => sum + slice.count, 0);

  return (
    <Card>
      <CardHeader title={title} />
      {slices.length === 0 || total === 0 ? (
        <EmptyState
          icon={<PieChart className="h-5 w-5" />}
          title="No data yet"
          description="Category activity will appear here once opportunities are available."
        />
      ) : (
        <>
          <div className="flex h-2 w-full overflow-hidden rounded-full">
            {slices.map((slice, index) => (
              <div
                key={slice.key}
                className={slice.colorClass ?? defaultColors[index % defaultColors.length]}
                style={{ width: `${(slice.count / total) * 100}%` }}
                aria-label={`${slice.label}: ${slice.count}`}
              />
            ))}
          </div>
          <ul className="mt-3 space-y-1.5">
            {slices.map((slice, index) => (
              <li
                key={slice.key}
                className="flex items-center justify-between text-xs"
              >
                <span className="flex items-center gap-2 text-neutral-700">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${slice.colorClass ?? defaultColors[index % defaultColors.length]}`}
                    aria-hidden
                  />
                  {slice.label}
                </span>
                <span className="text-neutral-500">
                  {slice.count}{" "}
                  <span className="text-neutral-400">
                    ({Math.round((slice.count / total) * 100)}%)
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}