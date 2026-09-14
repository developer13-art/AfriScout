import { PageHeader } from "../../components/layout/PageHeader";
import { OpportunityGrid } from "../../components/opportunities/OpportunityGrid";
import { EmptyState } from "../../components/ui/EmptyState";
import { Loader } from "../../components/ui/Loader";
import { Bookmark } from "lucide-react";
import { useSaved } from "../../hooks/useSaved";
import { SeoHead } from "../../components/common/SeoHead";

export function Saved() {
  const saved = useSaved();

  const savedIds = new Set((saved.data ?? []).map((s) => s.opportunityId));

  return (
    <>
      <SeoHead title="Saved" />
      <PageHeader
        title="Saved opportunities"
        description="Opportunities you saved for later."
      />

      {saved.isLoading ? (
        <Loader fullPage label="Loading saved" />
      ) : (saved.data ?? []).length === 0 ? (
        <EmptyState
          icon={<Bookmark className="h-6 w-6" />}
          title="Nothing saved yet"
          description="Save opportunities from the explore page to find them here."
        />
      ) : (
        <OpportunityGrid
          opportunities={(saved.data ?? []).map((s) => s.opportunity)}
          savedIds={savedIds}
          onSave={(id) => saved.remove.mutate(id)}
        />
      )}
    </>
  );
}