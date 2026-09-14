import type { AuditLog } from "../../types/auditLog";
import { DataTable, type DataTableColumn } from "../ui/DataTable";
import { EmptyState } from "../ui/EmptyState";
import { ScrollText } from "lucide-react";
import { formatDateTime } from "../../utils/formatDate";

export interface AuditLogTableProps {
  logs: AuditLog[];
}

export function AuditLogTable({ logs }: AuditLogTableProps) {
  if (logs.length === 0) {
    return (
      <EmptyState
        icon={<ScrollText className="h-6 w-6" />}
        title="No audit logs"
        description="Actions will be recorded here as they occur."
      />
    );
  }

  const columns: DataTableColumn<AuditLog>[] = [
    {
      key: "created",
      header: "When",
      cell: (log) => formatDateTime(log.createdAt),
    },
    { key: "actor", header: "Actor", cell: (log) => log.actorUserId ?? log.actorApiKeyId ?? "system" },
    { key: "action", header: "Action", cell: (log) => log.action },
    { key: "entity", header: "Entity", cell: (log) => log.entityType ?? "-" },
    { key: "entityId", header: "Entity ID", cell: (log) => log.entityId ?? "-" },
  ];

  return <DataTable columns={columns} rows={logs} rowKey={(log) => log.id} />;
}