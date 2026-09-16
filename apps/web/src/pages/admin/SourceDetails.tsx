import { useParams } from "react-router-dom";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "../../components/layout/PageHeader";
import { BackButton } from "../../components/common/BackButton";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { SourceHealthBadge } from "../../components/admin/SourceHealthBadge";
import { SourceRunTable } from "../../components/admin/SourceRunTable";
import { Loader } from "../../components/ui/Loader";
import { Alert } from "../../components/ui/Alert";
import { useSource } from "../../hooks/useSources";
import { useActorRuns } from "../../hooks/useActorRuns";
import { sourceService } from "../../services/source.service";
import { actorRunService } from "../../services/actorRun.service";
import { formatDateTime } from "../../utils/formatDate";
import { SeoHead } from "../../components/common/SeoHead";

export function SourceDetails() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);
  const source = useSource(id);
  const runs = useActorRuns({ sourceId: id }, 1, 20);

  const test = useMutation({
    mutationFn: () =>
      id ? sourceService.test(id) : Promise.resolve({ success: false, itemsFound: 0 }),
    onSuccess: (result) =>
      setMessage(
        `Test completed. ${result.itemsFound} items found. ${
          result.success ? "Extraction succeeded." : "Extraction failed."
        }`,
      ),
  });

  const runDiscovery = useMutation({
    mutationFn: () => (id ? actorRunService.trigger(id) : Promise.resolve(null)),
    onSuccess: () => {
      setMessage("Discovery run enqueued. It will appear in Recent runs shortly.");
      qc.invalidateQueries({ queryKey: ["actor-runs"] });
    },
  });

  if (source.isLoading) return <Loader fullPage label="Loading source" />;
  if (source.isError || !source.data) {
    return <Alert tone="danger">Source not found.</Alert>;
  }

  const s = source.data;

  return (
    <>
      <SeoHead title={s.name} />
      <BackButton label="Back to sources" to="/admin/sources" />
      <div className="mt-3">
        <PageHeader
          title={s.name}
          description={s.url}
          actions={
            <>
              <Button
                variant="outline"
                onClick={() => test.mutate()}
                loading={test.isPending}
              >
                Test source
              </Button>
              <Button
                onClick={() => runDiscovery.mutate()}
                loading={runDiscovery.isPending}
              >
                Run discovery
              </Button>
            </>
          }
        />
      </div>

      {message ? (
        <Alert tone="info" className="mb-4">
          {message}
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Overview" />
          <CardBody>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="font-medium text-neutral-900">Health:</span>{" "}
                <SourceHealthBadge health={s.health} />
              </li>
              <li>
                <span className="font-medium text-neutral-900">Active:</span>{" "}
                {s.active ? "Yes" : "No"}
              </li>
              <li>
                <span className="font-medium text-neutral-900">Frequency:</span>{" "}
                {s.crawlFrequency}
              </li>
              <li>
                <span className="font-medium text-neutral-900">Adapter:</span>{" "}
                {s.adapter}
              </li>
              <li>
                <span className="font-medium text-neutral-900">Type:</span>{" "}
                {s.sourceType}
              </li>
              <li>
                <span className="font-medium text-neutral-900">
                  Successes / failures:
                </span>{" "}
                {s.successCount} / {s.failureCount}
              </li>
              <li>
                <span className="font-medium text-neutral-900">Last run:</span>{" "}
                {s.lastRunAt ? formatDateTime(s.lastRunAt) : "Never"}
              </li>
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Recent runs" />
          <CardBody>
            {runs.isLoading ? (
              <Loader label="Loading runs" />
            ) : (
              <SourceRunTable runs={runs.data ?? []} />
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}