import type { Opportunity } from "../../types/opportunity";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { formatDate } from "../../utils/formatDate";

export interface DuplicateCandidate {
  id: string;
  canonical: Opportunity;
  candidate: Opportunity;
  similarity: number;
  status: "PENDING" | "MERGED" | "SEPARATE" | "IGNORED";
}

export interface DuplicateReviewCardProps {
  duplicate: DuplicateCandidate;
  onMerge: (id: string) => void;
  onSeparate: (id: string) => void;
  onIgnore: (id: string) => void;
}

export function DuplicateReviewCard({
  duplicate,
  onMerge,
  onSeparate,
  onIgnore,
}: DuplicateReviewCardProps) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <Badge tone="warning">
          Similarity {Math.round(duplicate.similarity * 100)}%
        </Badge>
        <Badge tone="neutral">{duplicate.status}</Badge>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 p-3">
          <p className="text-xs uppercase text-neutral-500">Canonical</p>
          <p className="mt-1 text-sm font-medium text-neutral-900">
            {duplicate.canonical.title}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {duplicate.canonical.organizationName ?? "-"} -{" "}
            {duplicate.canonical.deadline
              ? formatDate(duplicate.canonical.deadline)
              : "No deadline"}
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 p-3">
          <p className="text-xs uppercase text-neutral-500">Candidate</p>
          <p className="mt-1 text-sm font-medium text-neutral-900">
            {duplicate.candidate.title}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {duplicate.candidate.organizationName ?? "-"} -{" "}
            {duplicate.candidate.deadline
              ? formatDate(duplicate.candidate.deadline)
              : "No deadline"}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => onSeparate(duplicate.id)}>
          Mark separate
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onIgnore(duplicate.id)}>
          Ignore
        </Button>
        <Button size="sm" onClick={() => onMerge(duplicate.id)}>
          Merge into canonical
        </Button>
      </div>
    </Card>
  );
}