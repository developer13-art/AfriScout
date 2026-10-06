import { PageHeader } from "../../components/layout/PageHeader";
import { ChangeReviewCard } from "../../components/admin/ChangeReviewCard";
import { EmptyState } from "../../components/ui/EmptyState";
import { Loader } from "../../components/ui/Loader";
import { ErrorState } from "../../components/ui/ErrorState";
import { Activity } from "lucide-react";
import { useChanges } from "../../hooks/useChanges";
import { SeoHead } from "../../components/common/SeoHead";

export function Changes() {
  const changes = useChanges();

  return (
    <>
      <SeoHead title="Changes" />
      <PageHeader
        title="Changes"
        description="Detected changes across active opportunities."
      />

      {changes.isLoading ? (
        <Loader fullPage label="Loading changes" />
      ) : changes.isError ? (
        <ErrorState title="Could not load changes" />
      ) : (changes.data ?? []).length === 0 ? (
        <EmptyState
          icon={<Activity className="h-6 w-6" />}
          title="No changes detected"
          description="Change events will appear here as sources update."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {(changes.data ?? []).map((change) => (
            <ChangeReviewCard key={change.id} change={change} />
          ))}
        </div>
      )}
    </>
  );
}