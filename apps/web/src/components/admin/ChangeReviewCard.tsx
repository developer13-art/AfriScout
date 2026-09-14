import type { OpportunityChange } from "../../types/opportunity";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { formatDateTime } from "../../utils/formatDate";

export interface ChangeReviewCardProps {
  change: OpportunityChange;
  opportunityTitle?: string;
  opportunityLink?: string;
}

function renderValue(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

export function ChangeReviewCard({
  change,
  opportunityTitle,
  opportunityLink,
}: ChangeReviewCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-neutral-900">
            {opportunityTitle ?? change.opportunityId}
          </p>
          <p className="text-xs text-neutral-500">
            {formatDateTime(change.detectedAt)}
          </p>
        </div>
        <Badge
          tone={
            change.severity === "CRITICAL"
              ? "danger"
              : change.severity === "IMPORTANT"
                ? "warning"
                : "neutral"
          }
        >
          {change.severity}
        </Badge>
      </div>
      <div className="mt-3 rounded-md bg-neutral-50 p-3 text-xs">
        <p className="font-semibold text-neutral-700">{change.field}</p>
        <div className="mt-1 grid gap-1 sm:grid-cols-2">
          <span className="truncate text-neutral-500">
            Old: {renderValue(change.oldValue)}
          </span>
          <span className="truncate text-neutral-700">
            New: {renderValue(change.newValue)}
          </span>
        </div>
      </div>
      {opportunityLink ? (
        <a
          href={opportunityLink}
          className="mt-3 inline-block text-xs font-medium text-primary-700 hover:underline"
        >
          View opportunity
        </a>
      ) : null}
    </Card>
  );
}