import { z } from "zod";

export const adminListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  q: z.string().trim().max(200).optional(),
  status: z.string().trim().max(40).optional(),
  role: z.string().trim().max(40).optional(),
});

export const auditLogFilterSchema = z.object({
  actorUserId: z.string().uuid().optional(),
  actorApiKeyId: z.string().uuid().optional(),
  action: z.string().trim().max(120).optional(),
  entityType: z.string().trim().max(80).optional(),
  entityId: z.string().trim().max(120).optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export const duplicateDecisionSchema = z.object({
  decision: z.enum(["MERGE", "SEPARATE", "IGNORE"]),
  canonicalId: z.string().uuid().optional(),
});

export const settingsPatchSchema = z.object({
  key: z.string().trim().min(1).max(120),
  value: z.unknown(),
});

export type AdminListQuery = z.infer<typeof adminListQuerySchema>;
export type AuditLogFilterInput = z.infer<typeof auditLogFilterSchema>;
export type DuplicateDecisionInput = z.infer<typeof duplicateDecisionSchema>;
export type SettingsPatchInput = z.infer<typeof settingsPatchSchema>;