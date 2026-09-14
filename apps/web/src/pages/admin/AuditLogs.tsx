import { useState } from "react";
import { PageHeader } from "../../components/layout/PageHeader";
import { Input } from "../../components/ui/Input";
import { AuditLogTable } from "../../components/admin/AuditLogTable";
import { Loader } from "../../components/ui/Loader";
import { useAuditLogs } from "../../hooks/useAuditLogs";
import { SeoHead } from "../../components/common/SeoHead";

export function AuditLogs() {
  const [query, setQuery] = useState("");
  const logs = useAuditLogs({ action: query || undefined });

  return (
    <>
      <SeoHead title="Audit logs" />
      <PageHeader
        title="Audit logs"
        description="Privileged actions recorded across the platform."
      />
      <div className="mb-4">
        <Input
          placeholder="Filter by action"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {logs.isLoading ? (
        <Loader fullPage label="Loading logs" />
      ) : (
        <AuditLogTable logs={logs.data ?? []} />
      )}
    </>
  );
}