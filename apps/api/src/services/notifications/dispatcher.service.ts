import { prisma } from "../../config/database";
import { logger } from "../../config/logger";
import type { NotificationCreateInput } from "../../types/notification";
import { createNotification } from "./notification.service";
import { deliverEmail } from "./channels/email.channel";
import { deliverInApp } from "./channels/inApp.channel";
import { deliverPush } from "./channels/push.channel";
import { deliverWebhook } from "./channels/webhook.channel";

const CHANNELS = ["IN_APP", "EMAIL", "PUSH", "WEBHOOK"] as const;

export async function dispatchNotification(input: NotificationCreateInput): Promise<void> {
  const notification = await createNotification(input);

  const preferences = await prisma.notificationPreference.findMany({
    where: { userId: input.userId, type: input.type },
  });
  const enabled = new Map(preferences.map((p) => [p.channel, p.enabled]));

  for (const channel of CHANNELS) {
    if (enabled.get(channel) === false) continue;

    const delivery = await prisma.notificationDelivery.create({
      data: {
        notificationId: notification.id,
        channel,
        status: "PENDING",
      },
    });

    try {
      switch (channel) {
        case "IN_APP":
          await deliverInApp(delivery.id);
          break;
        case "EMAIL":
          await deliverEmail(delivery.id, notification);
          break;
        case "PUSH":
          await deliverPush(delivery.id, notification);
          break;
        case "WEBHOOK":
          await deliverWebhook(delivery.id, notification);
          break;
      }
      await prisma.notificationDelivery.update({
        where: { id: delivery.id },
        data: { status: "SENT", lastAttemptAt: new Date(), attempts: { increment: 1 } },
      });
    } catch (error) {
      logger.error(
        { err: error, channel, notificationId: notification.id },
        "notification_delivery_failed",
      );
      await prisma.notificationDelivery.update({
        where: { id: delivery.id },
        data: {
          status: "FAILED",
          lastAttemptAt: new Date(),
          attempts: { increment: 1 },
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        },
      });
    }
  }
}