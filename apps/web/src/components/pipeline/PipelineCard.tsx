import { Link } from "react-router-dom";
import { Calendar, Building2 } from "lucide-react";
import type { PipelineItem } from "../../types/pipeline";
import type { Opportunity } from "../../types/opportunity";
import { Card } from "../ui/Card";
import { DeadlineBadge } from "../common/DeadlineBadge";

export interface PipelineCardProps {
  item: PipelineItem;
  opportunity?: Opportunity;
  onOpen?: (item: PipelineItem) => void;
  draggable?: boolean;
  onDragStart?: (item: PipelineItem) => void;
}

export function PipelineCard({
  item,
  opportunity,
  onOpen,
  draggable,
  onDragStart,
}: PipelineCardProps) {
  return (
    <Card
      padding="sm"
      interactive
      className="cursor-pointer"
      onClick={() => onOpen?.(item)}
      draggable={draggable}
      onDragStart={draggable ? () => onDragStart?.(item) : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-neutral-900 line-clamp-2">
            {opportunity?.title ?? "Opportunity"}
          </p>
          {opportunity?.organizationName ? (
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-neutral-500">
              <Building2 aria-hidden className="h-3 w-3" />
              {opportunity.organizationName}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
        {opportunity?.deadline ? (
          <span className="inline-flex items-center gap-1">
            <Calendar aria-hidden className="h-3.5 w-3.5" />
            <DeadlineBadge deadline={opportunity.deadline} />
          </span>
        ) : null}
        {item.submissionReference ? (
          <span className="truncate text-neutral-500">
            Ref: {item.submissionReference}
          </span>
        ) : null}
      </div>

      {opportunity?.slug ? (
        <Link
          to={`/opportunities/${opportunity.slug}`}
          className="mt-3 inline-block text-xs font-medium text-primary-700 hover:underline"
          onClick={(event) => event.stopPropagation()}
        >
          View opportunity
        </Link>
      ) : null}
    </Card>
  );
}