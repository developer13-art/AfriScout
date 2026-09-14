import type {
  DeliveryStatusKey,
  NotificationChannelKey,
  NotificationTypeKey,
} from "../constants/notificationTypes";

export interface NotificationDTO {
  id: string;
  userId: string;
  type: NotificationTypeKey;
  title: string;
  body?: string | null;
  data?: Record<string, unknown> | null;
  opportunityId?: string | null;
  sourceId?: string | null;
  readAt?: string | null;
  createdAt: string;
}

export interface NotificationPreferenceDTO {
  id: string;
  userId: string;
  channel: NotificationChannelKey;
  type: NotificationTypeKey;
  enabled: boolean;
}

export interface NotificationDeliveryDTO {
  id: string;
  notificationId: string;
  channel: NotificationChannelKey;
  status: DeliveryStatusKey;
  attempts: number;
  lastAttemptAt?: string | null;
  errorMessage?: string | null;
}