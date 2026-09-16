import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "../../components/layout/PageHeader";
import { BackButton } from "../../components/common/BackButton";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Loader } from "../../components/ui/Loader";
import { ErrorState } from "../../components/ui/ErrorState";
import { PipelineStatusBadge } from "../../components/pipeline/PipelineStatusBadge";
import { PipelineMoveDialog } from "../../components/pipeline/PipelineMoveDialog";
import { OpportunityChecklist } from "../../components/opportunities/OpportunityChecklist";
import { OpportunityNotes } from "../../components/opportunities/OpportunityNotes";
import { pipelineService } from "../../services/pipeline.service";
import type { PipelineStage } from "../../types/pipeline";
import { SeoHead } from "../../components/common/SeoHead";

export function PipelineDetail() {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const [moveOpen, setMoveOpen] = useState(false);

  const query = useQuery({
    queryKey: ["pipeline", "item", itemId],
    queryFn: () => (itemId ? pipelineService.getItem(itemId) : null),
    enabled: Boolean(itemId),
  });

  if (query.isLoading) return <Loader fullPage label="Loading item" />;
  if (query.isError || !query.data) {
    return <ErrorState title="Pipeline item not found" />;
  }

  const { item, opportunity, checklistItems, events } = query.data;

  const toggleChecklist = async (checklistItemId: string, completed: boolean) => {
    const next = checklistItems.map((ci) =>
      ci.id === checklistItemId
        ? { ...ci, completed, completedAt: completed ? new Date().toISOString() : null }
        : ci,
    );
    await pipelineService.updateChecklist(item.id, next);
    query.refetch();
  };

  const addNote = async (body: string) => {
    await (pipelineService as any).addNote?.(item.id, body);
    query.refetch();
  };

  return (
    <>
      <SeoHead title={`Pipeline - ${opportunity.title}`} />
      <BackButton label="Back to pipeline" to="/pipeline" />
      <div className="mt-3">
        <PageHeader
          title={opportunity.title}
          description={opportunity.organizationName ?? undefined}
          actions={
            <>
              <PipelineStatusBadge stage={item.stage} />
              <Button size="sm" onClick={() => setMoveOpen(true)}>
                Update stage
              </Button>
            </>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Checklist" />
          <CardBody>
            <OpportunityChecklist
              items={checklistItems.map((ci) => ({
                id: ci.id,
                label: ci.label,
                description: ci.description ?? undefined,
                isRequired: ci.isRequired,
                completed: ci.completed,
                source: ci.source,
              }))}
              onToggle={toggleChecklist}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Notes" />
          <CardBody>
            <OpportunityNotes notes={[]} onAdd={addNote} />
          </CardBody>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Events" />
        <CardBody>
          <ul className="space-y-2">
            {events.length === 0 ? (
              <li className="text-sm text-neutral-500">No events yet.</li>
            ) : (
              events.map((event) => (
                <li
                  key={event.id}
                  className="flex items-start justify-between gap-3 border-b border-neutral-100 py-2 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-800">
                      {event.type}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {event.fromStage ? `From ${event.fromStage} ` : ""}
                      {event.toStage ? `to ${event.toStage}` : ""}
                    </p>
                  </div>
                  <span className="text-[11px] text-neutral-400">
                    {new Date(event.createdAt).toLocaleString()}
                  </span>
                </li>
              ))
            )}
          </ul>
        </CardBody>
      </Card>

      <PipelineMoveDialog
        open={moveOpen}
        onClose={() => setMoveOpen(false)}
        currentStage={item.stage}
        onSubmit={async (result) => {
          await pipelineService.move(
            item.id,
            result.stage as PipelineStage,
            result.submissionReference,
          );
          query.refetch();
          navigate("/pipeline");
        }}
      />
    </>
  );
}