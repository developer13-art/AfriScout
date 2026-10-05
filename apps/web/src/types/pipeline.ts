export type PipelineStage =
  | "DISCOVERED"
  | "REVIEWING"
  | "QUALIFIED"
  | "PREPARING"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "WON"
  | "LOST"
  | "WITHDRAWN"
  | "DISQUALIFIED"
  | "EXPIRED";

export type OutcomeType =
  | "WON"
  | "LOST"
  | "WITHDRAWN"
  | "DISQUALIFIED"
  | "EXPIRED"
  | "PENDING";

export type PipelineEventType =
  | "CREATED"
  | "STAGE_CHANGED"
  | "NOTE_ADDED"
  | "CHECKLIST_UPDATED"
  | "SUBMISSION_RECORDED"
  | "OUTCOME_RECORDED";

export interface Pipeline {
  id: string;
  userId: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineItem {
  id: string;
  pipelineId: string;
  opportunityId: string;
  stage: PipelineStage;
  ownerUserId?: string | null;
  notes?: string | null;
  submissionDate?: string | null;
  submissionReference?: string | null;
  outcomeType?: OutcomeType | null;
  outcomeValue?: number | null;
  outcomeCurrency?: string | null;
  outcomeDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineEvent {
  id: string;
  pipelineItemId: string;
  type: PipelineEventType;
  fromStage?: PipelineStage | null;
  toStage?: PipelineStage | null;
  actorUserId?: string | null;
  data?: Record<string, unknown> | null;
  createdAt: string;
}

export interface Checklist {
  id: string;
  pipelineItemId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItem {
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

export interface PipelineNote {
  id: string;
  pipelineItemId: string;
  authorUserId?: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
}