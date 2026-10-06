import type { DeliveryStatusKey } from "../constants/notificationTypes";

export type WebhookEventKey =
  | "opportunity.created"
  | "opportunity.updated"
  | "opportunity.expired"
  | "match.created"
  | "pipeline.stage_changed"
  | "source.failed";

export interface WebhookEndpointDTO {
  id: string;
  userId: string;
  url: string;
  events: WebhookEventKey[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookDeliveryDTO {
  id: string;
  endpointId: string;
  event: WebhookEventKey;
  payload: Record<string, unknown>;
  status: DeliveryStatusKey;
  attempts: number;
  responseStatus?: number | null;
  responseBody?: string | null;
  lastAttemptAt?: string | null;
  nextAttemptAt?: string | null;
  createdAt: string;
  updatedAt: string;
}