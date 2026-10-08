import { Checkbox } from "../ui/Checkbox";
import { EmptyState } from "../ui/EmptyState";
import { ListChecks } from "lucide-react";

export interface ChecklistItemView {
  id: string;
  label: string;
  description?: string;
  isRequired: boolean;
  completed: boolean;
  source: "SOURCE_FACT" | "AI_INTERPRETATION";
}

export interface OpportunityChecklistProps {
  items: ChecklistItemView[];
  onToggle: (itemId: string, completed: boolean) => void;
  disabled?: boolean;
}

export function OpportunityChecklist({
  items,
  onToggle,
  disabled,
}: OpportunityChecklistProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<ListChecks className="h-5 w-5" />}
        title="No checklist yet"
        description="Requirements converted into a checklist will appear here."
      />
    );
  }

  const completedCount = items.filter((item) => item.completed).length;
  const total = items.length;
  const pct = Math.round((completedCount / total) * 100);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-neutral-500">
        <span>
          {completedCount} / {total} complete
        </span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
        <div
          className="h-full bg-primary-600 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <Checkbox
              label={item.label}
              description={item.description}
              checked={item.completed}
              disabled={disabled}
              onChange={(e) => onToggle(item.id, e.target.checked)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}