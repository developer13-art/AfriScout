import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/layout/PageHeader";
import { Loader } from "../../components/ui/Loader";
import { ErrorState } from "../../components/ui/ErrorState";
import { EmptyState } from "../../components/ui/EmptyState";
import { PipelineBoard } from "../../components/pipeline/PipelineBoard";
import { Workflow } from "lucide-react";
import { usePipeline } from "../../hooks/usePipeline";
import { useOpportunityStore } from "../../stores/opportunityStore";
import type { PipelineItem, PipelineStage } from "../../types/pipeline";
import { SeoHead } from "../../components/common/SeoHead";

export function Pipeline() {
  const navigate = useNavigate();
  const pipeline = usePipeline();
  const opportunities = useOpportunityStore((s) => s.cache);
  const [pendingItem] = useState<PipelineItem | null>(null);

  const opportunitiesById = useMemo(() => opportunities, [opportunities]);

  const open = (item: PipelineItem) => navigate(`/pipeline/${item.id}`);

  return (
    <>
      <SeoHead title="Pipeline" />
      <PageHeader
        title="Opportunity pipeline"
        description="Track opportunities from discovery through to outcome."
      />

      {pendingItem ? (
        <p className="mb-3 text-xs text-neutral-500">
          Move {pendingItem.id} to another stage using drag and drop.
        </p>
      ) : null}

      {pipeline.isLoading ? (
        <Loader fullPage label="Loading pipeline" />
      ) : pipeline.isError ? (
        <ErrorState title="Could not load pipeline" />
      ) : (pipeline.data ?? []).length === 0 ? (
        <EmptyState
          icon={<Workflow className="h-6 w-6" />}
          title="Your pipeline is empty"
          description="Add opportunities from the explore page to start tracking them."
        />
      ) : (
        <PipelineBoard
          items={pipeline.data ?? []}
          opportunitiesById={opportunitiesById}
          onOpenItem={open}
          onMoveItem={(itemId, stage) =>
            pipeline.move.mutate({ itemId, stage: stage as PipelineStage })
          }
        />
      )}
    </>
  );
}