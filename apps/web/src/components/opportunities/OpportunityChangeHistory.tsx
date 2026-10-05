import type { OpportunityChange } from "../../types/opportunity";
import { Timeline, type TimelineItem } from "../ui/Timeline";
import { formatDateTime } from "../../utils/formatDate";

export interface OpportunityChangeHistoryProps {
  changes: OpportunityChange[];
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function OpportunityChangeHistory({
  changes,
}: OpportunityChangeHistoryProps) {
  if (changes.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        No changes have been detected for this opportunity.
      </p>
    );
  }

  const items: TimelineItem[] = changes.map((change) => ({
    id: change.id,
    title: `${change.field} updated`,
    description: `${formatValue(change.oldValue)} to ${formatValue(change.newValue)}`,
    timestamp: formatDateTime(change.detectedAt),
    tone:
      change.severity === "CRITICAL"
        ? "danger"
        : change.severity === "IMPORTANT"
          ? "warning"
          : "default",
  }));

  return <Timeline items={items} />;
}