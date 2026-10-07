import { http } from "./http";
import type { WebhookDelivery, WebhookEndpoint } from "../types/webhook";

export const webhookService = {
  listEndpoints: () => http<WebhookEndpoint[]>("/webhooks/endpoints"),
  createEndpoint: (endpoint: { url: string; events: string[] }) =>
    http<WebhookEndpoint>("/webhooks/endpoints", {
      method: "POST",
      body: JSON.stringify(endpoint),
    }),
  updateEndpoint: (id: string, patch: Partial<WebhookEndpoint>) =>
    http<WebhookEndpoint>(`/webhooks/endpoints/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  deleteEndpoint: (id: string) =>
    http<void>(`/webhooks/endpoints/${id}`, { method: "DELETE" }),
  deliveries: (endpointId?: string) =>
    http<WebhookDelivery[]>("/webhooks/deliveries", {
      query: { endpointId },
    }),
  retry: (deliveryId: string) =>
    http<WebhookDelivery>(`/webhooks/deliveries/${deliveryId}/retry`, {
      method: "POST",
    }),
};