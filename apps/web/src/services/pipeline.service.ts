import { http } from "./http";
import type {
  Checklist,
  ChecklistItem,
  Pipeline,
  PipelineEvent,
  PipelineItem,
  PipelineStage,
} from "../types/pipeline";
import type { Opportunity } from "../types/opportunity";

export interface PipelineDetail {
  item: PipelineItem;
  opportunity: Opportunity;
  checklist: Checklist | null;
  checklistItems: ChecklistItem[];
  events: PipelineEvent[];
}

export const pipelineService = {
  listPipelines: () => http<Pipeline[]>("/pipeline"),
  listItems: (pipelineId?: string) =>
    http<PipelineItem[]>("/pipeline/items", { query: { pipelineId } }),
  getItem: (itemId: string) => http<PipelineDetail>(`/pipeline/items/${itemId}`),
  add: (opportunityId: string, pipelineId?: string) =>
    http<PipelineItem>("/pipeline/items", {
      method: "POST",
      body: JSON.stringify({ opportunityId, pipelineId }),
    }),
  move: (itemId: string, stage: PipelineStage, submissionReference?: string) =>
    http<PipelineItem>(`/pipeline/items/${itemId}/stage`, {
      method: "PATCH",
      body: JSON.stringify({ stage, submissionReference }),
    }),
  remove: (itemId: string) =>
    http<void>(`/pipeline/items/${itemId}`, { method: "DELETE" }),
  updateChecklist: (itemId: string, checklistItems: ChecklistItem[]) =>
    http<ChecklistItem[]>(`/pipeline/items/${itemId}/checklist`, {
      method: "PUT",
      body: JSON.stringify({ items: checklistItems }),
    }),
  recordOutcome: (
    itemId: string,
    outcome: { outcomeType: string; outcomeValue?: number; outcomeCurrency?: string },
  ) =>
    http<PipelineItem>(`/pipeline/items/${itemId}/outcome`, {
      method: "POST",
      body: JSON.stringify(outcome),
    }),
};