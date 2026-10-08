import { logger } from "../../config/logger";
import { DELIVER_WEBHOOK_JOB } from "../definitions/deliverWebhook.job";
import { deliverWebhook } from "../../services/webhooks/outboundWebhook.service";

export async function processWebhookJob(job: { name: string; payload: unknown }): Promise<void> {
      if (job.name === DELIVER_WEBHOOK_JOB) {
        const { deliveryId } = job.payload as { deliveryId: string };
        await deliverWebhook(deliveryId);
      }
    }
}