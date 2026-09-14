import type { AiSummary } from "../../types/ai";
import { Card, CardHeader } from "../ui/Card";
import { AiDisclaimer } from "./AiDisclaimer";
import { Sparkles } from "lucide-react";

export interface AiSummaryCardProps {
  summary?: AiSummary | null;
  loading?: boolean;
}

export function AiSummaryCard({ summary, loading }: AiSummaryCardProps) {
  return (
    <Card>
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            <Sparkles aria-hidden className="h-4 w-4 text-teal-600" />
            AI summary
          </span>
        }
      />
      {loading ? (
        <div className="space-y-2">
          <div className="skeleton h-3 w-full rounded" />
          <div className="skeleton h-3 w-5/6 rounded" />
          <div className="skeleton h-3 w-2/3 rounded" />
        </div>
      ) : !summary ? (
        <p className="text-sm text-neutral-500">
          No AI summary is available for this opportunity yet.
        </p>
      ) : (
        <>
          <p className="text-sm text-neutral-700 whitespace-pre-line">
            {summary.summary}
          </p>
          <AiDisclaimer className="mt-3" />
          <p className="mt-2 text-[11px] text-neutral-400">
            Provider: {summary.provider} - Model: {summary.model}
          </p>
        </>
      )}
    </Card>
  );
}