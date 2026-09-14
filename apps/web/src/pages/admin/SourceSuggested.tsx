import { useQuery } from "@tanstack/react-query";
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
  const query = useQuery({
    queryKey: ["source-suggestions"],
    queryFn: () => sourceService.suggestions(),
  });

  return (
    <>
      <SeoHead title="Suggested sources" />
      <PageHeader
        title="Suggested sources"
        description="Sources proposed by users awaiting review."
      />

      {query.isLoading ? (
        <Loader fullPage label="Loading suggestions" />
      ) : (query.data ?? []).length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-6 w-6" />}
          title="No suggestions"
          description="User-submitted sources will appear here for review."
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
                    {suggestion.notes ? (
                      <p className="mt-1 text-xs text-neutral-600">
                        {suggestion.notes}
                      </p>
                    ) : null}
                  </div>
                  <Badge tone="neutral">{suggestion.status}</Badge>
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <Button variant="outline" size="sm">
                    Reject
                  </Button>
                  <Button size="sm">Mark verified</Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}