export type NotificationType =
  | "NEW_MATCH"
  | "DEADLINE_SOON"
  | "DEADLINE_CHANGED"
  | "REQUIREMENT_CHANGED"
  | "OPPORTUNITY_UPDATED"
  | "OPPORTUNITY_EXPIRED"
  | "SOURCE_FAILED"
  | "SOURCE_HEALTH_WARNING"
  | "PIPELINE_REMINDER"
  | "SYSTEM";

export type NotificationChannel = "IN_APP" | "EMAIL" | "PUSH" | "WEBHOOK";

export type DeliveryStatus = "PENDING" | "SENT" | "FAILED" | "SKIPPED";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  data?: Record<string, unknown> | null;
  opportunityId?: string | null;
  sourceId?: string | null;
  readAt?: string | null;
  createdAt: string;
}

export interface NotificationPreference {
  id: string;
  userId: string;
  channel: NotificationChannel;
  type: NotificationType;
  enabled: boolean;
  createdAt: string;
}

export interface NotificationDelivery {
  id: string;
  notificationId: string;
  channel: NotificationChannel;
  status: DeliveryStatus;
  attempts: number;
  lastAttemptAt?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}