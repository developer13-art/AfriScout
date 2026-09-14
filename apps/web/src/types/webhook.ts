export type DeliveryStatus = "PENDING" | "SENT" | "FAILED" | "SKIPPED";

export type WebhookEvent =
  | "opportunity.created"
  | "opportunity.updated"
  | "opportunity.expired"
  | "match.created"
  | "pipeline.stage_changed"
  | "source.failed";

export interface WebhookEndpoint {
  id: string;
  userId: string;
  url: string;
  events: WebhookEvent[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookDelivery {
  id: string;
  endpointId: string;
  event: WebhookEvent;
  payload: Record<string, unknown>;
  status: DeliveryStatus;
  attempts: number;
  responseStatus?: number | null;
  responseBody?: string | null;
  lastAttemptAt?: string | null;
  nextAttemptAt?: string | null;
  createdAt: string;
  updatedAt: string;
}