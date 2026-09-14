import { createHmac, timingSafeEqual } from "node:crypto";
import { apifyConfig } from "../../config/apify";
import { verifySignature } from "../../utils/signature";
import { UnauthorizedError } from "../../utils/errors";
import type { ApifyWebhookPayload } from "../../types/apify";

export function verifyApifyWebhook(rawBody: Buffer | string, signature: string): void {
  const ok = verifySignature(rawBody, signature, apifyConfig.webhookSecret);
  if (!ok) throw new UnauthorizedError("Apify webhook signature is invalid");
}

export function buildApifyWebhookPayload(input: {
  eventType: string;
  resource: Record<string, unknown>;
  eventData?: Record<string, unknown>;
}): ApifyWebhookPayload {
  return {
    eventType: input.eventType,
    eventData: input.eventData ?? {},
    resource: input.resource,
    createdAt: new Date().toISOString(),
  };
}

export function signWebhookBody(body: string): string {
  return createHmac("sha256", apifyConfig.webhookSecret).update(body).digest("hex");
}

export function constantTimeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function extractRunResource(payload: ApifyWebhookPayload): {
  runId: string | null;
  datasetId: string | null;
  status: string | null;
} {
  const resource = payload.resource as Record<string, unknown>;
  const runId = typeof resource.id === "string" ? resource.id : null;
  const datasetId =
    typeof resource.defaultDatasetId === "string" ? resource.defaultDatasetId : null;
  const status = typeof resource.status === "string" ? resource.status : null;
  return { runId, datasetId, status };
}