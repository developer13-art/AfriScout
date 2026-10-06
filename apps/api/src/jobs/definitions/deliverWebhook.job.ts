import { webhookQueue } from "../queues/webhook.queue";

export interface DeliverWebhookPayload {
  deliveryId: string;
}

export const DELIVER_WEBHOOK_JOB = "deliver-webhook";

export async function enqueueDeliverWebhook(payload: DeliverWebhookPayload) {
  return webhookQueue.add(DELIVER_WEBHOOK_JOB, payload);
}