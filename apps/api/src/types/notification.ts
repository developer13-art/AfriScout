import type {
  DeliveryStatusKey,
  NotificationChannelKey,
  NotificationTypeKey,
} from "../constants/notificationTypes";

export interface NotificationCreateInput {
  userId: string;
  type: NotificationTypeKey;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
  opportunityId?: string;
  sourceId?: string;
}

export interface NotificationDeliveryInput {
  notificationId: string;
  channel: NotificationChannelKey;
}

export interface NotificationDeliveryRecord {
  id: string;
  notificationId: string;
  channel: NotificationChannelKey;
  status: DeliveryStatusKey;
  attempts: number;
  lastAttemptAt: string | null;
  errorMessage: string | null;
}

export interface NotificationPreferenceInput {
  userId: string;
  channel: NotificationChannelKey;
  type: NotificationTypeKey;
  enabled: boolean;
}