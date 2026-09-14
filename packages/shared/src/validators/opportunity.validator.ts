import { z } from "zod";

export const opportunityFilterSchema = z.object({
  q: z.string().trim().max(200).optional(),
  category: z.string().trim().max(60).optional(),
  opportunityType: z.string().trim().max(60).optional(),
  countryCode: z.string().trim().length(2).optional(),
  region: z.string().trim().max(120).optional(),
  city: z.string().trim().max(120).optional(),
  isRemote: z.coerce.boolean().optional(),
  minValue: z.coerce.number().nonnegative().optional(),
  maxValue: z.coerce.number().nonnegative().optional(),
  currency: z.string().trim().length(3).optional(),
  publishedAfter: z.string().datetime().optional(),
  deadlineBefore: z.string().datetime().optional(),
  deadlineAfter: z.string().datetime().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "CLOSED", "CANCELLED", "ARCHIVED"]).optional(),
  verificationStatus: z.enum(["UNVERIFIED", "PARTIAL", "VERIFIED", "DISPUTED"]).optional(),
  organizationId: z.string().uuid().optional(),
  sourceId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  sort: z.string().trim().max(60).optional(),
});

export const opportunitySlugParamSchema = z.object({
  slug: z.string().trim().min(1).max(200),
});

export const opportunityIdParamSchema = z.object({
  id: z.string().uuid(),
});