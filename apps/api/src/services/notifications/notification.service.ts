import { prisma } from "../../config/database";
import type { NotificationCreateInput } from "../../types/notification";

export async function createNotification(input: NotificationCreateInput) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      data: (input.data ?? null) as never,
      opportunityId: input.opportunityId ?? null,
      sourceId: input.sourceId ?? null,
    },
  });
}

export async function listNotifications(input: {
  userId: string;
  page?: number;
  pageSize?: number;
}) {
  const page = input.page ?? 1;
  const pageSize = Math.min(input.pageSize ?? 30, 100);
  const [items, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: input.userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.notification.count({ where: { userId: input.userId } }),
  ]);
  return { items, total, page, pageSize };
}

export async function unreadCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

export async function markRead(userId: string, notificationId: string) {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { readAt: new Date() },
  });
}

export async function markAllRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function listPreferences(userId: string) {
  return prisma.notificationPreference.findMany({ where: { userId } });
}

export async function updatePreference(input: {
  userId: string;
  channel: string;
  type: string;
  enabled: boolean;
}) {
  return prisma.notificationPreference.upsert({
    where: {
      userId_channel_type: {
        userId: input.userId,
        channel: input.channel as never,
        type: input.type as never,
      },
    },
    update: { enabled: input.enabled },
    create: {
      userId: input.userId,
      channel: input.channel as never,
      type: input.type as never,
      enabled: input.enabled,
    },
  });
}