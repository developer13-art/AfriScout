import type { DeliveryStatusKey } from "../constants/notificationTypes";

export type WebhookEventKey =
  | "opportunity.created"
  | "opportunity.updated"
  | "opportunity.expired"
  | "match.created"
  | "pipeline.stage_changed"
  | "source.failed";

export interface WebhookEndpointRecord {
  id: string;
  userId: string;
  url: string;
  secretHash: string;
  events: WebhookEventKey[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookEndpointCreateInput {
  userId: string;
  url: string;
  events: WebhookEventKey[];
}

export interface WebhookDeliveryRecord {
  id: string;
  endpointId: string;
  event: WebhookEventKey;
  payload: Record<string, unknown>;
  status: DeliveryStatusKey;
  attempts: number;
  responseStatus: number | null;
  responseBody: string | null;
  lastAttemptAt: string | null;
  nextAttemptAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OutboundWebhookPayload {
  id: string;
  event: WebhookEventKey;
  createdAt: string;
  data: Record<string, unknown>;
}