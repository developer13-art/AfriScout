import { useMemo } from "react";
import type { PipelineItem, PipelineStage } from "../../types/pipeline";
import type { Opportunity } from "../../types/opportunity";
import { PipelineColumn } from "./PipelineColumn";
import { PipelineCard } from "./PipelineCard";
import { pipelineStageLabel } from "./PipelineStatusBadge";

const STAGES: PipelineStage[] = [
  "DISCOVERED",
  "REVIEWING",
  "QUALIFIED",
  "PREPARING",
  "SUBMITTED",
  "UNDER_REVIEW",
  "WON",
  "LOST",
  "WITHDRAWN",
  "DISQUALIFIED",
  "EXPIRED",
];

export interface PipelineBoardProps {
  items: PipelineItem[];
  opportunitiesById?: Record<string, Opportunity>;
  onOpenItem?: (item: PipelineItem) => void;
  onMoveItem?: (itemId: string, stage: PipelineStage) => void;
}

export function PipelineBoard({
  items,
  opportunitiesById,
  onOpenItem,
  onMoveItem,
}: PipelineBoardProps) {
  const grouped = useMemo(() => {
    const map = new Map<PipelineStage, PipelineItem[]>();
    for (const stage of STAGES) map.set(stage, []);
    for (const item of items) {
      const list = map.get(item.stage);
      if (list) list.push(item);
    }
    return map;
  }, [items]);

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {STAGES.map((stage) => (
        <PipelineColumn
          key={stage}
          stage={stage}
          title={pipelineStageLabel(stage)}
          items={grouped.get(stage) ?? []}
          onDropItem={onMoveItem}
          renderCard={(item) => (
            <PipelineCard
              item={item}
              opportunity={opportunitiesById?.[item.opportunityId]}
              onOpen={onOpenItem}
              draggable={Boolean(onMoveItem)}
              onDragStart={(dragged) => {
                const event = window.event as DragEvent | undefined;
                if (event && "dataTransfer" in event) {
                  (event as DragEvent).dataTransfer?.setData(
                    "text/pipeline-item-id",
                    dragged.id,
                  );
                }
              }}
            />
          )}
        />
      ))}
    </div>
  );
}