import { prisma } from "../../config/database";
import { logger } from "../../config/logger";
import { signPayloadWithPrefix } from "../../utils/signature";
import { env } from "../../config/env";
import type { WebhookEventKey } from "../../types/webhook";

export interface EnqueueInput {
  endpointId: string;
  event: WebhookEventKey;
  payload: Record<string, unknown>;
}

export async function enqueueOutboundWebhook(input: EnqueueInput) {
  const delivery = await prisma.webhookDelivery.create({
    data: {
      endpointId: input.endpointId,
      event: input.event,
      payload: input.payload as never,
      status: "PENDING",
      nextAttemptAt: new Date(),
    },
  });

  logger.info(
    { deliveryId: delivery.id, endpointId: input.endpointId, event: input.event },
    "outbound_webhook_enqueued",
  );

  return delivery;
}

export async function deliverWebhook(deliveryId: string): Promise<void> {
  const delivery = await prisma.webhookDelivery.findUnique({
    where: { id: deliveryId },
    include: { endpoint: true },
  });
  if (!delivery || !delivery.endpoint.active) return;

  const body = JSON.stringify({
    id: delivery.id,
    event: delivery.event,
    createdAt: delivery.createdAt.toISOString(),
    data: delivery.payload,
  });
  const signature = signPayloadWithPrefix(body, env.OUTBOUND_WEBHOOK_SECRET);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.OUTBOUND_WEBHOOK_TIMEOUT_MS);

  try {
    const response = await fetch(delivery.endpoint.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-AfriScout-Signature": signature,
        "X-AfriScout-Event": delivery.event,
      },
      body,
      signal: controller.signal,
    });

    const text = await response.text();
    const ok = response.ok;

    await prisma.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        status: ok ? "SENT" : "FAILED",
        attempts: { increment: 1 },
        responseStatus: response.status,
        responseBody: text.slice(0, 2000),
        lastAttemptAt: new Date(),
        nextAttemptAt: ok ? null : new Date(Date.now() + 60_000),
      },
    });
  } catch (error) {
    await prisma.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        status: "FAILED",
        attempts: { increment: 1 },
        lastAttemptAt: new Date(),
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        nextAttemptAt: new Date(Date.now() + 60_000),
      },
    });
  } finally {
    clearTimeout(timer);
  }
}