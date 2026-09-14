export interface AuditLog {
  id: string;
  actorUserId?: string | null;
  actorApiKeyId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  data?: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditLogFilters {
  actorUserId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  createdAfter?: string;
  createdBefore?: string;
}