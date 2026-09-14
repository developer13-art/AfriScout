import { useState, type DragEvent, type ReactNode } from "react";
import type { PipelineItem, PipelineStage } from "../../types/pipeline";
import { cn } from "../../utils/strings";

export interface PipelineColumnProps {
  stage: PipelineStage;
  title: string;
  items: PipelineItem[];
  renderCard: (item: PipelineItem) => ReactNode;
  onDropItem?: (itemId: string, stage: PipelineStage) => void;
}

export function PipelineColumn({
  stage,
  title,
  items,
  renderCard,
  onDropItem,
}: PipelineColumnProps) {
  const [over, setOver] = useState(false);

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setOver(true);
  };

  const onDragLeave = () => setOver(false);

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setOver(false);
    const itemId = event.dataTransfer.getData("text/pipeline-item-id");
    if (itemId) onDropItem?.(itemId, stage);
  };

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "flex min-w-[260px] flex-col rounded-xl border bg-neutral-50/60 p-2.5 transition-colors",
        over ? "border-primary-500 bg-teal-50/50" : "border-neutral-200",
      )}
    >
      <div className="flex items-center justify-between px-1 pb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-600">
          {title}
        </h3>
        <span className="text-xs font-medium text-neutral-500">{items.length}</span>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto">
        {items.length === 0 ? (
          <p className="px-1 py-4 text-center text-xs text-neutral-400">
            No items
          </p>
        ) : (
          items.map((item) => <div key={item.id}>{renderCard(item)}</div>)
        )}
      </div>
    </div>
  );
}