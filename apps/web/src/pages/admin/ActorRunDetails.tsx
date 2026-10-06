import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "../../components/layout/PageHeader";
import { BackButton } from "../../components/common/BackButton";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Loader } from "../../components/ui/Loader";
import { ErrorState } from "../../components/ui/ErrorState";
import { Badge } from "../../components/ui/Badge";
import { actorRunService } from "../../services/actorRun.service";
import { formatDateTime } from "../../utils/formatDate";
import { SeoHead } from "../../components/common/SeoHead";

export function ActorRunDetails() {
  const { id } = useParams<{ id: string }>();
  const runQuery = useQuery({
    queryKey: ["actor-run", id],
    queryFn: () => (id ? actorRunService.get(id) : null),
    enabled: Boolean(id),
  });
  const rawQuery = useQuery({
    queryKey: ["actor-run", id, "raw"],
    queryFn: () => (id ? actorRunService.rawItems(id) : Promise.resolve([])),
    enabled: Boolean(id),
  });

  if (runQuery.isLoading) return <Loader fullPage label="Loading run" />;
  if (runQuery.isError || !runQuery.data) {
    return <ErrorState title="Run not found" />;
  }

  const run = runQuery.data;

  return (
    <>
      <SeoHead title="Actor run details" />
      <BackButton label="Back to runs" to="/admin/actor-runs" />
      <div className="mt-3">
        <PageHeader title="Run details" description={run.id} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Summary" />
          <CardBody>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="font-medium text-neutral-900">Status:</span>{" "}
                <Badge tone="neutral">{run.status}</Badge>
              </li>
              <li>
                <span className="font-medium text-neutral-900">Trigger:</span>{" "}
                {run.trigger}
              </li>
              <li>
                <span className="font-medium text-neutral-900">Found:</span>{" "}
                {run.itemsFound}
              </li>
              <li>
                <span className="font-medium text-neutral-900">Imported:</span>{" "}
                {run.itemsImported}
              </li>
              <li>
                <span className="font-medium text-neutral-900">Updated:</span>{" "}
                {run.itemsUpdated}
              </li>
              <li>
                <span className="font-medium text-neutral-900">Duplicates:</span>{" "}
                {run.itemsDuplicate}
              </li>
              <li>
                <span className="font-medium text-neutral-900">Invalid:</span>{" "}
                {run.itemsInvalid}
              </li>
              <li>
                <span className="font-medium text-neutral-900">Started:</span>{" "}
                {run.startedAt ? formatDateTime(run.startedAt) : "-"}
              </li>
              <li>
                <span className="font-medium text-neutral-900">Finished:</span>{" "}
                {run.finishedAt ? formatDateTime(run.finishedAt) : "-"}
              </li>
              {run.errorMessage ? (
                <li className="text-red-600">{run.errorMessage}</li>
              ) : null}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Raw items" />
          <CardBody>
            {rawQuery.isLoading ? (
              <Loader label="Loading raw items" />
            ) : (rawQuery.data ?? []).length === 0 ? (
              <p className="text-sm text-neutral-500">No raw items recorded.</p>
            ) : (
              <ul className="space-y-2">
                {(rawQuery.data ?? []).map((raw) => (
                  <li
                    key={raw.id}
                    className="rounded-md border border-neutral-200 p-2 text-xs"
                  >
                    <p className="font-medium text-neutral-800">
                      {raw.processingStatus}
                    </p>
                    <p className="text-neutral-500">
                      Fetched {formatDateTime(raw.fetchedAt)}
                    </p>
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