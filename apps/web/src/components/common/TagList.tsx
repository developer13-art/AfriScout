import { cn } from "../../utils/strings";

export interface TagListProps {
  tags: string[];
  max?: number;
  className?: string;
}

export function TagList({ tags, max = 8, className }: TagListProps) {
  const visible = tags.slice(0, max);
  const remaining = tags.length - visible.length;

  if (tags.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {visible.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-700"
        >
          {tag}
        </span>
      ))}
      {remaining > 0 ? (
        <span className="text-[11px] font-medium text-neutral-500">
          +{remaining} more
        </span>
      ) : null}
    </div>
  );
}