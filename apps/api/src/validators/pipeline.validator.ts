import { z } from "zod";

export const pipelineStageEnum = z.enum([
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
]);

export const outcomeTypeEnum = z.enum([
  "WON",
  "LOST",
  "WITHDRAWN",
  "DISQUALIFIED",
  "EXPIRED",
  "PENDING",
]);

export const pipelineCreateSchema = z.object({
  opportunityId: z.string().uuid(),
  pipelineId: z.string().uuid().optional(),
  ownerUserId: z.string().uuid().optional(),
});

export const pipelineMoveSchema = z.object({
  stage: pipelineStageEnum,
  submissionReference: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(4000).optional(),
});

export const checklistItemSchema = z.object({
  id: z.string().uuid(),
  label: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional(),
  isRequired: z.boolean(),
  completed: z.boolean(),
  orderIndex: z.number().int().nonnegative(),
  source: z.enum(["SOURCE_FACT", "AI_INTERPRETATION"]),
});

export const updateChecklistSchema = z.object({
  items: z.array(checklistItemSchema).max(200),
});

export const pipelineNoteSchema = z.object({
  body: z.string().trim().min(1).max(4000),
});

export const outcomeSchema = z.object({
  outcomeType: outcomeTypeEnum,
  outcomeValue: z.number().nonnegative().nullable().optional(),
  outcomeCurrency: z.string().trim().length(3).nullable().optional(),
  outcomeDate: z.string().datetime().nullable().optional(),
});

export type PipelineCreateInput = z.infer<typeof pipelineCreateSchema>;
export type PipelineMoveInput = z.infer<typeof pipelineMoveSchema>;
export type UpdateChecklistInput = z.infer<typeof updateChecklistSchema>;
export type PipelineNoteInput = z.infer<typeof pipelineNoteSchema>;
export type OutcomeInput = z.infer<typeof outcomeSchema>;