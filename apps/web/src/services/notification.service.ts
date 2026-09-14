import { http } from "./http";
import type { Notification, NotificationPreference } from "../types/notification";

export const notificationService = {
  list: (page = 1, pageSize = 30) =>
    http<Notification[]>("/notifications", { query: { page, pageSize } }),
  unreadCount: () => http<{ count: number }>("/notifications/unread-count"),
  markRead: (id: string) =>
    http<Notification>(`/notifications/${id}/read`, { method: "POST" }),
  markAllRead: () => http<void>("/notifications/read-all", { method: "POST" }),
  preferences: () => http<NotificationPreference[]>("/notifications/preferences"),
  updatePreference: (preference: Partial<NotificationPreference>) =>
    http<NotificationPreference>("/notifications/preferences", {
      method: "PATCH",
      body: JSON.stringify(preference),
    }),
};