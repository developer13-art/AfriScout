import type { UserLifecycleKey } from "../constants/lifecycles";

export type OutcomeTypeKey = "WON" | "LOST" | "WITHDRAWN" | "DISQUALIFIED" | "EXPIRED" | "PENDING";

export type PipelineEventTypeKey =
  | "CREATED"
  | "STAGE_CHANGED"
  | "NOTE_ADDED"
  | "CHECKLIST_UPDATED"
  | "SUBMISSION_RECORDED"
  | "OUTCOME_RECORDED";

export interface PipelineItemDTO {
  id: string;
  pipelineId: string;
  opportunityId: string;
  stage: UserLifecycleKey;
  ownerUserId?: string | null;
  notes?: string | null;
  submissionDate?: string | null;
  submissionReference?: string | null;
  outcomeType?: OutcomeTypeKey | null;
  outcomeValue?: number | null;
  outcomeCurrency?: string | null;
  outcomeDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineEventDTO {
  id: string;
  pipelineItemId: string;
  type: PipelineEventTypeKey;
  fromStage?: UserLifecycleKey | null;
  toStage?: UserLifecycleKey | null;
  actorUserId?: string | null;
  data?: Record<string, unknown> | null;
  createdAt: string;
}

export interface ChecklistItemDTO {
  id: string;
  checklistId: string;
  label: string;
  description?: string | null;
  isRequired: boolean;
  completed: boolean;
  completedAt?: string | null;
  orderIndex: number;
  source: "SOURCE_FACT" | "AI_INTERPRETATION";
  createdAt: string;
}