import { env } from "../../../config/env";
import { prisma } from "../../../config/database";
import type { Notification } from "@prisma/client";

export async function deliverPush(
  deliveryId: string,
  notification: Notification,
): Promise<void> {
  if (!env.WEB_PUSH_ENABLED) {
    await prisma.notificationDelivery.update({
      where: { id: deliveryId },
      data: { status: "SKIPPED" },
    });
    return;
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: notification.userId },
  });

  if (subscriptions.length === 0) {
    await prisma.notificationDelivery.update({
      where: { id: deliveryId },
      data: { status: "SKIPPED" },
    });
    return;
  }

  // Push delivery requires a web-push compatible library. When configured,
  // iterate subscriptions and send the payload here. Until enabled, we mark
  // the delivery as skipped so we never fabricate success.
  await prisma.notificationDelivery.update({
    where: { id: deliveryId },
    data: { status: "SKIPPED" },
  });
}