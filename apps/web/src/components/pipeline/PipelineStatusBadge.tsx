import { Badge, type BadgeTone } from "../ui/Badge";
import type { PipelineStage } from "../../types/pipeline";

const stageTone: Record<PipelineStage, BadgeTone> = {
  DISCOVERED: "neutral",
  REVIEWING: "info",
  QUALIFIED: "primary",
  PREPARING: "warning",
  SUBMITTED: "primary",
  UNDER_REVIEW: "info",
  WON: "success",
  LOST: "danger",
  WITHDRAWN: "neutral",
  DISQUALIFIED: "danger",
  EXPIRED: "neutral",
};

const stageLabel: Record<PipelineStage, string> = {
  DISCOVERED: "Discovered",
  REVIEWING: "Reviewing",
  QUALIFIED: "Qualified",
  PREPARING: "Preparing",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under review",
  WON: "Won",
  LOST: "Lost",
  WITHDRAWN: "Withdrawn",
  DISQUALIFIED: "Disqualified",
  EXPIRED: "Expired",
};

export function PipelineStatusBadge({ stage }: { stage: PipelineStage }) {
  return <Badge tone={stageTone[stage]}>{stageLabel[stage]}</Badge>;
}

export function pipelineStageLabel(stage: PipelineStage): string {
  return stageLabel[stage];
}