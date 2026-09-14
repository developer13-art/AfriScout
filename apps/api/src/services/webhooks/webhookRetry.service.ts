import { prisma } from "../../config/database";
import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { deliverWebhook } from "./outboundWebhook.service";

export async function retryDueWebhooks(): Promise<number> {
  const now = new Date();
  const due = await prisma.webhookDelivery.findMany({
    where: {
      status: "FAILED",
      nextAttemptAt: { lte: now },
      attempts: { lt: env.OUTBOUND_WEBHOOK_MAX_ATTEMPTS },
    },
    select: { id: true },
    take: 50,
  });

  for (const delivery of due) {
    try {
      await deliverWebhook(delivery.id);
    } catch (error) {
      logger.error({ err: error, deliveryId: delivery.id }, "webhook_retry_failed");
    }
  }

  return due.length;
}