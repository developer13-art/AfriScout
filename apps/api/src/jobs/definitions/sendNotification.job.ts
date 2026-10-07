import { notificationQueue } from "../queues/notification.queue";
import type { NotificationCreateInput } from "../../types/notification";

export const SEND_NOTIFICATION_JOB = "send-notification";

export async function enqueueSendNotification(payload: NotificationCreateInput) {
  return notificationQueue.add(SEND_NOTIFICATION_JOB, payload);
}