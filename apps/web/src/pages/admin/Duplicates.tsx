import { PageHeader } from "../../components/layout/PageHeader";
import { DuplicateReviewCard } from "../../components/admin/DuplicateReviewCard";
import { EmptyState } from "../../components/ui/EmptyState";
import { Loader } from "../../components/ui/Loader";
import { ErrorState } from "../../components/ui/ErrorState";
import { GitCompareArrows } from "lucide-react";
import { useDuplicates } from "../../hooks/useDuplicates";
import { SeoHead } from "../../components/common/SeoHead";

export function Duplicates() {
  const duplicates = useDuplicates();

  return (
    <>
      <SeoHead title="Duplicates" />
      <PageHeader
        title="Duplicate review"
        description="Candidate duplicate opportunities awaiting a decision."
      />

      {duplicates.isLoading ? (
        <Loader fullPage label="Loading duplicates" />
      ) : duplicates.isError ? (
        <ErrorState title="Could not load duplicates" />
      ) : (duplicates.data ?? []).length === 0 ? (
        <EmptyState
          icon={<GitCompareArrows className="h-6 w-6" />}
          title="No pending duplicates"
          description="We will surface candidates here when similarity thresholds are met."
        />
      ) : (
        <div className="space-y-3">
          {(duplicates.data ?? []).map((duplicate) => (
            <DuplicateReviewCard
              key={duplicate.id}
              duplicate={duplicate}
              onMerge={(id) => duplicates.merge.mutate(id)}
              onSeparate={(id) => duplicates.separate.mutate(id)}
              onIgnore={(id) => duplicates.ignore.mutate(id)}
            />
          ))}
        </div>
      )}
    </>
  );
}