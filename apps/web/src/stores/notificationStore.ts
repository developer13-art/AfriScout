import { create } from "zustand";
import type { Notification } from "../types/notification";

interface NotificationState {
  items: Notification[];
  unreadCount: number;
  setItems: (items: Notification[]) => void;
  push: (notification: Notification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  reset: () => void;
}

function computeUnread(items: Notification[]): number {
  return items.filter((n) => !n.readAt).length;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  items: [],
  unreadCount: 0,
  setItems: (items) => set({ items, unreadCount: computeUnread(items) }),
  push: (notification) =>
    set((state) => {
      const items = [notification, ...state.items];
      return { items, unreadCount: computeUnread(items) };
    }),
  markRead: (id) =>
    set((state) => {
      const items = state.items.map((n) =>
        n.id === id ? { ...n, readAt: n.readAt ?? new Date().toISOString() } : n,
      );
      return { items, unreadCount: computeUnread(items) };
    }),
  markAllRead: () =>
    set((state) => {
      const now = new Date().toISOString();
      const items = state.items.map((n) => ({ ...n, readAt: n.readAt ?? now }));
      return { items, unreadCount: 0 };
    }),
  reset: () => set({ items: [], unreadCount: 0 }),
}));