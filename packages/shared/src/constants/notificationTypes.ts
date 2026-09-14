export const NOTIFICATION_TYPES = [
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
] as const;

export type NotificationTypeKey = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_CHANNELS = ["IN_APP", "EMAIL", "PUSH", "WEBHOOK"] as const;

export type NotificationChannelKey = (typeof NOTIFICATION_CHANNELS)[number];

export const DELIVERY_STATUSES = ["PENDING", "SENT", "FAILED", "SKIPPED"] as const;

export type DeliveryStatusKey = (typeof DELIVERY_STATUSES)[number];