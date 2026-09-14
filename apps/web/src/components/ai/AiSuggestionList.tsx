import { CheckCircle2 } from "lucide-react";

export interface AiSuggestionListProps {
  title: string;
  items: string[];
  emptyMessage?: string;
}

export function AiSuggestionList({
  title,
  items,
  emptyMessage = "No suggestions available.",
}: AiSuggestionListProps) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {title}
      </p>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-neutral-500">{emptyMessage}</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {items.map((item, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <CheckCircle2
                aria-hidden
                className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
              />
              <span className="text-neutral-700">{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}