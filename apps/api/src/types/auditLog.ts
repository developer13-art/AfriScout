export interface AuditLogInput {
  actorUserId?: string | null;
  actorApiKeyId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  data?: Record<string, unknown>;
}

export interface AuditLogRecord {
  id: string;
  actorUserId: string | null;
  actorApiKeyId: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  data: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditLogQuery {
  actorUserId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  createdAfter?: string;
  createdBefore?: string;
  page?: number;
  pageSize?: number;
}