import { http } from "./http";
import type { AuditLog, AuditLogFilters } from "../types/auditLog";

export const auditLogService = {
  list: (filters?: AuditLogFilters, page = 1, pageSize = 50) =>
    http<AuditLog[]>("/audit-logs", {
      query: { ...filters, page, pageSize },
    }),
};