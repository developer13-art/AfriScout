import { z } from "zod";

export const webhookEventEnum = z.enum([
  "opportunity.created",
  "opportunity.updated",
  "opportunity.expired",
  "match.created",
  "pipeline.stage_changed",
  "source.failed",
]);

export const webhookEndpointCreateSchema = z.object({
  url: z.string().url(),
  events: z.array(webhookEventEnum).min(1),
});

export const webhookEndpointUpdateSchema = z.object({
  url: z.string().url().optional(),
  events: z.array(webhookEventEnum).min(1).optional(),
  active: z.boolean().optional(),
});

export const webhookEndpointIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type WebhookEndpointCreateInput = z.infer<typeof webhookEndpointCreateSchema>;
export type WebhookEndpointUpdateInput = z.infer<typeof webhookEndpointUpdateSchema>;