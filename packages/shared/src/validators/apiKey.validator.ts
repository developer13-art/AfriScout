import { z } from "zod";

export const apiKeyScopeSchema = z.enum([
  "opportunities:read",
  "opportunities:write",
  "sources:read",
  "matches:read",
  "analytics:read",
  "webhooks:manage",
]);

export const apiKeyCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  scopes: z.array(apiKeyScopeSchema).min(1),
  expiresAt: z.string().datetime().nullable().optional(),
});

export const apiKeyIdParamSchema = z.object({
  id: z.string().uuid(),
});