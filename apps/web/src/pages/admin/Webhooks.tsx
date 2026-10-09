import { PageHeader } from "../../components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Badge } from "../../components/ui/Badge";
import { Loader } from "../../components/ui/Loader";
import { Webhook } from "lucide-react";
import { useWebhooks } from "../../hooks/useWebhooks";
import { formatDateTime } from "../../utils/formatDate";
import { SeoHead } from "../../components/common/SeoHead";

export function Webhooks() {
  const webhooks = useWebhooks();

  return (
    <>
      <SeoHead title="Webhooks" />
      <PageHeader
        title="Webhooks"
        description="Outbound webhook endpoints and recent deliveries."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Endpoints" />
          <CardBody>
            {webhooks.endpoints.isLoading ? (
              <Loader label="Loading endpoints" />
            ) : (webhooks.endpoints.data ?? []).length === 0 ? (
              <EmptyState
                icon={<Webhook className="h-6 w-6" />}
                title="No endpoints"
              />
            ) : (
              <ul className="divide-y divide-neutral-100">
                {(webhooks.endpoints.data ?? []).map((ep) => (
                  <li key={ep.id} className="py-3">
                    <p className="truncate text-sm font-medium text-neutral-900">
                      {ep.url}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {ep.events.map((event) => (
                        <Badge key={event} tone="neutral" size="sm">
                          {event}
                        </Badge>
                      ))}
                      <Badge tone={ep.active ? "success" : "neutral"}>
                        {ep.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Recent deliveries" />
          <CardBody>
            {webhooks.deliveries.isLoading ? (
              <Loader label="Loading deliveries" />
            ) : (webhooks.deliveries.data ?? []).length === 0 ? (
              <p className="text-sm text-neutral-500">No deliveries yet.</p>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {(webhooks.deliveries.data ?? [])
                  .slice(0, 20)
                  .map((delivery) => (
                    <li key={delivery.id} className="flex items-center justify-between py-2">
                      <span className="text-xs text-neutral-600">
                        {delivery.event}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {formatDateTime(delivery.createdAt)}
                      </span>
                    </li>
                  ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}