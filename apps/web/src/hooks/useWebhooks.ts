import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { webhookService } from "../services/webhook.service";
import type { WebhookEndpoint } from "../types/webhook";

export function useWebhooks() {
  const qc = useQueryClient();

  const endpoints = useQuery({
    queryKey: ["webhook-endpoints"],
    queryFn: () => webhookService.listEndpoints(),
  });

  const deliveries = useQuery({
    queryKey: ["webhook-deliveries"],
    queryFn: () => webhookService.deliveries(),
  });

  const create = useMutation({
    mutationFn: (endpoint: { url: string; events: string[] }) =>
      webhookService.createEndpoint(endpoint),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["webhook-endpoints"] }),
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<WebhookEndpoint> }) =>
      webhookService.updateEndpoint(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["webhook-endpoints"] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => webhookService.deleteEndpoint(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["webhook-endpoints"] }),
  });

  const retry = useMutation({
    mutationFn: (deliveryId: string) => webhookService.retry(deliveryId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["webhook-deliveries"] }),
  });

  return { endpoints, deliveries, create, update, remove, retry };
}