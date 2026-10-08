import { PageHeader } from "../../components/layout/PageHeader";
import { Loader } from "../../components/ui/Loader";
import { EmptyState } from "../../components/ui/EmptyState";
import { Card } from "../../components/ui/Card";
import { Switch } from "../../components/ui/Switch";
import { Button } from "../../components/ui/Button";
import { Eye } from "lucide-react";
import { useWatchlist } from "../../hooks/useWatchlist";
import { Link } from "react-router-dom";
import { DeadlineBadge } from "../../components/common/DeadlineBadge";
import { SeoHead } from "../../components/common/SeoHead";

export function Watchlist() {
  const watchlist = useWatchlist();

  return (
    <>
      <SeoHead title="Watchlist" />
      <PageHeader
        title="Watchlist"
        description="Opportunities we monitor for changes and deadline updates."
      />

      {watchlist.isLoading ? (
        <Loader fullPage label="Loading watchlist" />
      ) : (watchlist.data ?? []).length === 0 ? (
        <EmptyState
          icon={<Eye className="h-6 w-6" />}
          title="Not watching anything"
          description="Add opportunities to your watchlist to receive updates."
        />
      ) : (
        <div className="space-y-3">
          {(watchlist.data ?? []).map((entry) => (
            <Card key={entry.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    to={`/opportunities/${entry.opportunity.slug}`}
                    className="text-sm font-medium text-neutral-900 hover:text-primary-700"
                  >
                    {entry.opportunity.title}
                  </Link>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {entry.opportunity.organizationName}
                  </p>
                  {entry.opportunity.deadline ? (
                    <div className="mt-1.5">
                      <DeadlineBadge deadline={entry.opportunity.deadline} />
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Switch
                    label="Deadline alerts"
                    checked={entry.notifyDeadline}
                    onChange={(event) =>
                      watchlist.update.mutate({
                        opportunityId: entry.opportunityId,
                        patch: { notifyDeadline: event.target.checked },
                      })
                    }
                  />
                  <Switch
                    label="Change alerts"
                    checked={entry.notifyChanges}
                    onChange={(event) =>
                      watchlist.update.mutate({
                        opportunityId: entry.opportunityId,
                        patch: { notifyChanges: event.target.checked },
                      })
                    }
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => watchlist.remove.mutate(entry.opportunityId)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}