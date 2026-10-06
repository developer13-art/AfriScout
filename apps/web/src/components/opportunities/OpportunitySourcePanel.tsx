import type { OpportunitySourceLink } from "../../types/opportunity";
import { ExternalLink, Link2 } from "lucide-react";
import { Badge } from "../ui/Badge";

export interface OpportunitySourcePanelProps {
  sources: OpportunitySourceLink[];
}

export function OpportunitySourcePanel({ sources }: OpportunitySourcePanelProps) {
  if (sources.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        Source information is not available.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {sources.map((source) => (
        <li
          key={source.id}
          className="flex items-start justify-between gap-3 rounded-lg border border-neutral-200 bg-white p-3"
        >
          <div className="flex min-w-0 items-start gap-2.5">
            <Link2 aria-hidden className="mt-0.5 h-4 w-4 text-neutral-500" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-neutral-900 truncate">
                  {source.sourceTitle ?? source.sourceUrl}
                </p>
                {source.isPrimary ? (
                  <Badge tone="primary" size="sm">Primary</Badge>
                ) : null}
              </div>
              <p className="mt-0.5 truncate text-xs text-neutral-500">
                {source.sourceUrl}
              </p>
            </div>
          </div>
          <a
            href={source.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-neutral-300 px-2.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 shrink-0"
          >
            <ExternalLink aria-hidden className="h-3.5 w-3.5" />
            Open
          </a>
        </li>
      ))}
    </ul>
  );
}