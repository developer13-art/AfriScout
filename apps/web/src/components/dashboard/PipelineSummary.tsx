import { Link } from "react-router-dom";
import { Card, CardHeader } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { Workflow, ArrowRight } from "lucide-react";

export interface PipelineStageCount {
  stage: string;
  label: string;
  count: number;
}

export interface PipelineSummaryProps {
  stages: PipelineStageCount[];
}

export function PipelineSummary({ stages }: PipelineSummaryProps) {
  const total = stages.reduce((sum, s) => sum + s.count, 0);

  return (
    <Card>
      <CardHeader
        title="Pipeline"
        actions={
          <Link
            to="/pipeline"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary-700 hover:underline"
          >
            Open <ArrowRight className="h-3 w-3" />
          </Link>
        }
      />
      {total === 0 ? (
        <EmptyState
          icon={<Workflow className="h-5 w-5" />}
          title="No items in pipeline"
          description="Add opportunities to your pipeline to track them through to outcome."
        />
      ) : (
        <ul className="space-y-2">
          {stages.map((stage) => (
            <li key={stage.stage} className="flex items-center justify-between text-sm">
              <span className="text-neutral-700">{stage.label}</span>
              <span className="font-semibold text-neutral-900">{stage.count}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}