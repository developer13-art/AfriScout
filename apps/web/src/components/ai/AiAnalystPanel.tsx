import type { AiAnalystResult } from "../../types/ai";
import { Card, CardHeader } from "../ui/Card";
import { AiSuggestionList } from "./AiSuggestionList";
import { AiDisclaimer } from "./AiDisclaimer";
import { Sparkles, ShieldAlert } from "lucide-react";
import { Button } from "../ui/Button";

export interface AiAnalystPanelProps {
  result?: AiAnalystResult | null;
  loading?: boolean;
  onRun?: () => void;
}

export function AiAnalystPanel({ result, loading, onRun }: AiAnalystPanelProps) {
  return (
    <Card>
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            <Sparkles aria-hidden className="h-4 w-4 text-teal-600" />
            AI opportunity analyst
          </span>
        }
        actions={
          onRun ? (
            <Button size="sm" variant="outline" onClick={onRun} loading={loading}>
              {result ? "Re-run analysis" : "Analyze"}
            </Button>
          ) : null
        }
      />

      {!result ? (
        <p className="text-sm text-neutral-500">
          Ask the analyst whether this opportunity is worth pursuing for your
          profile.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border border-teal-100 bg-teal-50/40 p-3">
            <p className="text-sm font-semibold text-teal-800">
              Recommendation
            </p>
            <p className="mt-1 text-sm text-teal-900">{result.recommendation}</p>
          </div>

          <AiSuggestionList title="Strengths" items={result.strengths} />
          <AiSuggestionList
            title="Concerns"
            items={result.concerns}
            emptyMessage="No concerns highlighted."
          />
          <AiSuggestionList
            title="Missing requirements"
            items={result.missingRequirements}
            emptyMessage="No missing requirements identified."
          />
          <AiSuggestionList title="Next steps" items={result.nextSteps} />

          <div className="flex items-start gap-2 rounded-md bg-amber-50 p-3 text-xs text-amber-800">
            <ShieldAlert aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>
              This is decision support only, not a guarantee. The official source
              is authoritative.
            </p>
          </div>

          <AiDisclaimer />
          <p className="text-[11px] text-neutral-400">
            Provider: {result.provider} - Model: {result.model}
          </p>
        </div>
      )}
    </Card>
  );
}