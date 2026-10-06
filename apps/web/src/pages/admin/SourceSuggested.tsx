import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card, CardBody } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import { Loader } from "../../components/ui/Loader";
import { Inbox } from "lucide-react";
import { sourceService } from "../../services/source.service";
import { SeoHead } from "../../components/common/SeoHead";

export function SourceSuggested() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["source-suggestions"],
    queryFn: () => sourceService.suggestions(),
  });
  const review = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "REJECTED" | "VERIFIED" }) =>
      sourceService.reviewSuggestion(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["source-suggestions"] }),
  });
  const candidates = query.data ?? [];

  return (
    <>
      <SeoHead title="Suggested sources" />
      <PageHeader
        title="Source discovery review"
        description="Review submitted source candidates before deciding whether they belong in Scout’s registry."
      />

      {candidates.length > 0 ? (
        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          {[
            ["Awaiting review", candidates.filter((item) => item.status === "SUGGESTED").length],
            ["Verified", candidates.filter((item) => item.status === "VERIFIED" || item.status === "ACTIVATED").length],
            ["Rejected", candidates.filter((item) => item.status === "REJECTED").length],
          ].map(([label, count]) => (
            <Card key={label}><CardBody className="p-4">
              <p className="text-xs text-neutral-500">{label}</p>
              <p className="mt-1 text-xl font-semibold text-neutral-900">{count}</p>
            </CardBody></Card>
          ))}
        </div>
      ) : null}

      {query.isLoading ? (
        <Loader fullPage label="Loading suggestions" />
      ) : (query.data ?? []).length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-6 w-6" />}
          title="No suggestions"
          description="Submitted sources will appear here for review."
        />
      ) : (
        <div className="space-y-3">
          {(query.data ?? []).map((suggestion) => (
            <Card key={suggestion.id}>
              <CardBody>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-900">
                      {suggestion.name}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {suggestion.url}
                    </p>
                    <a href={suggestion.url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-medium text-primary-700 hover:underline">
                      Open source ↗
                    </a>
                    {suggestion.notes ? (
                      <p className="mt-1 text-xs text-neutral-600">
                        {suggestion.notes}
                      </p>
                    ) : null}
                  </div>
                  <Badge tone="neutral">{suggestion.status}</Badge>
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    loading={review.isPending}
                    disabled={suggestion.status === "REJECTED"}
                    onClick={() => review.mutate({ id: suggestion.id, status: "REJECTED" })}
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    loading={review.isPending}
                    disabled={suggestion.status === "VERIFIED" || suggestion.status === "ACTIVATED"}
                    onClick={() => review.mutate({ id: suggestion.id, status: "VERIFIED" })}
                  >
                    Mark verified
                  </Button>
                </div>
                {review.isError ? <p role="alert" className="mt-2 text-right text-xs text-red-600">Review update failed. Try again.</p> : null}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}