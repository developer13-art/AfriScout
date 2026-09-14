import { useState } from "react";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Checkbox } from "../../components/ui/Checkbox";
import { EmptyState } from "../../components/ui/EmptyState";
import { Loader } from "../../components/ui/Loader";
import { Webhook } from "lucide-react";
import { useWebhooks } from "../../hooks/useWebhooks";
import { formatDateTime } from "../../utils/formatDate";
import { SeoHead } from "../../components/common/SeoHead";

const eventOptions = [
  "opportunity.created",
  "opportunity.updated",
  "opportunity.expired",
  "match.created",
  "pipeline.stage_changed",
  "source.failed",
];

export function WebhookSettings() {
  const webhooks = useWebhooks();
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>([
    "opportunity.created",
    "match.created",
  ]);

  return (
    <>
      <SeoHead title="Webhooks" />
      <PageHeader
        title="Webhooks"
        description="Receive signed events from AfriScout to your own systems."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card>
          <CardHeader title="Your endpoints" />
          <CardBody>
            {webhooks.endpoints.isLoading ? (
              <Loader label="Loading endpoints" />
            ) : (webhooks.endpoints.data ?? []).length === 0 ? (
              <EmptyState
                icon={<Webhook className="h-5 w-5" />}
                title="No endpoints yet"
                description="Create an endpoint to begin receiving events."
              />
            ) : (
              <ul className="divide-y divide-neutral-100">
                {(webhooks.endpoints.data ?? []).map((endpoint) => (
                  <li key={endpoint.id} className="py-3">
                    <p className="truncate text-sm font-medium text-neutral-900">
                      {endpoint.url}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {endpoint.events.join(", ")}
                    </p>
                    <p className="mt-0.5 text-[11px] text-neutral-400">
                      Created {formatDateTime(endpoint.createdAt)}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => webhooks.remove.mutate(endpoint.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Create an endpoint" />
          <CardBody>
            <div className="space-y-4">
              <Input
                label="Endpoint URL"
                placeholder="https://example.com/webhooks/afriscout"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Events
                </p>
                <div className="space-y-2">
                  {eventOptions.map((event) => (
                    <Checkbox
                      key={event}
                      label={event}
                      checked={events.includes(event)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEvents((prev) => [...prev, event]);
                        } else {
                          setEvents((prev) => prev.filter((x) => x !== event));
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
              <Button
                fullWidth
                disabled={!url || events.length === 0}
                loading={webhooks.create.isPending}
                onClick={() =>
                  webhooks.create.mutate({ url, events })
                }
              >
                Create endpoint
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}