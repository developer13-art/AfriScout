import { z } from "zod";

export const notificationTypeSchema = z.enum([
  "NEW_MATCH",
  "DEADLINE_SOON",
  "DEADLINE_CHANGED",
  "REQUIREMENT_CHANGED",
  "OPPORTUNITY_UPDATED",
  "OPPORTUNITY_EXPIRED",
  "SOURCE_FAILED",
  "SOURCE_HEALTH_WARNING",
  "PIPELINE_REMINDER",
  "SYSTEM",
]);

export const notificationChannelSchema = z.enum(["IN_APP", "EMAIL", "PUSH", "WEBHOOK"]);

export const updateNotificationPreferenceSchema = z.object({
  channel: notificationChannelSchema,
  type: notificationTypeSchema,
  enabled: z.boolean(),
});