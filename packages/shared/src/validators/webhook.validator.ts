import { z } from "zod";

export const webhookEventSchema = z.enum([
  "opportunity.created",
  "opportunity.updated",
  "opportunity.expired",
  "match.created",
  "pipeline.stage_changed",
  "source.failed",
]);

export const webhookEndpointCreateSchema = z.object({
  url: z.string().url(),
  events: z.array(webhookEventSchema).min(1),
});

export const webhookEndpointUpdateSchema = z.object({
  url: z.string().url().optional(),
  events: z.array(webhookEventSchema).min(1).optional(),
  active: z.boolean().optional(),
});

export const webhookEndpointIdParamSchema = z.object({
  id: z.string().uuid(),
});