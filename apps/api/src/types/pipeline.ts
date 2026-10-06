import type { UserLifecycleKey } from "../constants/lifecycles";

export type OutcomeTypeKey =
  | "WON"
  | "LOST"
  | "WITHDRAWN"
  | "DISQUALIFIED"
  | "EXPIRED"
  | "PENDING";

export type PipelineEventTypeKey =
  | "CREATED"
  | "STAGE_CHANGED"
  | "NOTE_ADDED"
  | "CHECKLIST_UPDATED"
  | "SUBMISSION_RECORDED"
  | "OUTCOME_RECORDED";

export interface PipelineCreateInput {
  userId: string;
  opportunityId: string;
  pipelineId?: string;
  ownerUserId?: string | null;
}

export interface PipelineMoveInput {
  itemId: string;
  stage: UserLifecycleKey;
  actorUserId: string;
  submissionReference?: string;
  notes?: string;
}

export interface ChecklistItemInput {
  label: string;
  description?: string | null;
  isRequired: boolean;
  source: "SOURCE_FACT" | "AI_INTERPRETATION";
  orderIndex: number;
  completed?: boolean;
}

export interface OutcomeInput {
  itemId: string;
  actorUserId: string;
  outcomeType: OutcomeTypeKey;
  outcomeValue?: number | null;
  outcomeCurrency?: string | null;
  outcomeDate?: string | null;
}