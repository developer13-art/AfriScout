import { useQuery } from "@tanstack/react-query";
import { auditLogService } from "../services/auditLog.service";
import type { AuditLogFilters } from "../types/auditLog";

export function useAuditLogs(filters?: AuditLogFilters, page = 1, pageSize = 50) {
  return useQuery({
    queryKey: ["audit-logs", filters, page, pageSize],
    queryFn: () => auditLogService.list(filters, page, pageSize),
  });
}