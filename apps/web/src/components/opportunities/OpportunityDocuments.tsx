import type { OpportunityDocument } from "../../types/opportunity";
import { FileText, ExternalLink } from "lucide-react";
import { Badge } from "../ui/Badge";

export interface OpportunityDocumentsProps {
  documents: OpportunityDocument[];
  emptyMessage?: string;
}

const statusTone: Record<string, "neutral" | "success" | "warning" | "danger"> = {
  PENDING: "neutral",
  FETCHING: "neutral",
  EXTRACTING: "warning",
  EXTRACTED: "success",
  FAILED: "danger",
  SKIPPED: "neutral",
};

export function OpportunityDocuments({
  documents,
  emptyMessage = "No documents attached to this opportunity.",
}: OpportunityDocumentsProps) {
  if (documents.length === 0) {
    return <p className="text-sm text-neutral-500">{emptyMessage}</p>;
  }

  return (
    <ul className="space-y-2">
      {documents.map((doc) => (
        <li
          key={doc.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white p-3"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <FileText aria-hidden className="h-4 w-4 text-neutral-500 shrink-0" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-neutral-900">
                {doc.fileName ?? doc.url}
              </p>
              {doc.mimeType ? (
                <p className="text-xs text-neutral-500">{doc.mimeType}</p>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge tone={statusTone[doc.extractionStatus] ?? "neutral"}>
              {doc.extractionStatus}
            </Badge>
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100"
              aria-label="Open document"
            >
              <ExternalLink aria-hidden className="h-4 w-4" />
            </a>
          </div>
        </li>
      ))}
    </ul>
  );
}