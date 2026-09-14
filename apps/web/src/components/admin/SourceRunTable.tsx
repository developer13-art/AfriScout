import { Link } from "react-router-dom";
import type { SourceRun } from "../../types/actorRun";
import { DataTable, type DataTableColumn } from "../ui/DataTable";
import { Badge } from "../ui/Badge";
import { EmptyState } from "../ui/EmptyState";
import { PlayCircle } from "lucide-react";
import { formatDateTime } from "../../utils/formatDate";

const statusTone = {
  QUEUED: "neutral",
  RUNNING: "info",
  SUCCEEDED: "success",
  FAILED: "danger",
  ABORTED: "warning",
  TIMED_OUT: "warning",
} as const;

export interface SourceRunTableProps {
  runs: SourceRun[];
}

export function SourceRunTable({ runs }: SourceRunTableProps) {
  if (runs.length === 0) {
    return (
      <EmptyState
        icon={<PlayCircle className="h-6 w-6" />}
        title="No runs yet"
        description="Actor runs will appear here once discovery is triggered."
      />
    );
  }

  const columns: DataTableColumn<SourceRun>[] = [
    {
      key: "started",
      header: "Started",
      cell: (run) => (run.startedAt ? formatDateTime(run.startedAt) : "-"),
    },
    {
      key: "status",
      header: "Status",
      cell: (run) => <Badge tone={statusTone[run.status]}>{run.status}</Badge>,
    },
    { key: "found", header: "Found", cell: (run) => run.itemsFound },
    { key: "imported", header: "Imported", cell: (run) => run.itemsImported },
    { key: "updated", header: "Updated", cell: (run) => run.itemsUpdated },
    { key: "duplicate", header: "Duplicates", cell: (run) => run.itemsDuplicate },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (run) => (
        <Link
          to={`/admin/actor-runs/${run.id}`}
          className="text-xs font-medium text-primary-700 hover:underline"
        >
          View
        </Link>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={runs}
      rowKey={(run) => run.id}
    />
  );
}