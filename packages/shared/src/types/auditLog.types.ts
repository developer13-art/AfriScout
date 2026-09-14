export interface AuditLogDTO {
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