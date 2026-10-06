import { prisma } from "../../../config/database";
import type { Notification } from "@prisma/client";
import { enqueueOutboundWebhook } from "../../webhooks/outboundWebhook.service";

export async function deliverWebhook(
  deliveryId: string,
  notification: Notification,
): Promise<void> {
  const endpoints = await prisma.webhookEndpoint.findMany({
    where: { userId: notification.userId, active: true },
  });

  if (endpoints.length === 0) {
    await prisma.notificationDelivery.update({
      where: { id: deliveryId },
      data: { status: "SKIPPED" },
    });
    return;
  }

  for (const endpoint of endpoints) {
    await enqueueOutboundWebhook({
      endpointId: endpoint.id,
      event: "match.created",
      payload: {
        notificationId: notification.id,
        title: notification.title,
        body: notification.body,
      },
    });
  }
}