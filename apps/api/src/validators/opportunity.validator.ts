import { z } from "zod";

export const opportunityCategoryEnum = z.enum([
  "PROCUREMENT",
  "CONTRACTS",
  "GRANTS",
  "FUNDING",
  "EMPLOYMENT",
  "INTERNSHIPS",
  "SCHOLARSHIPS",
  "FELLOWSHIPS",
  "ACCELERATORS",
  "INCUBATORS",
  "COMPETITIONS",
  "TRAINING",
  "RESEARCH",
  "PARTNERSHIPS",
  "INVESTMENT",
  "DEVELOPMENT",
  "OTHER",
]);

export const opportunityTypeEnum = z.enum([
  "TENDER",
  "RFP",
  "RFQ",
  "CONTRACT",
  "GRANT",
  "FUNDING",
  "JOB",
  "INTERNSHIP",
  "SCHOLARSHIP",
  "FELLOWSHIP",
  "ACCELERATOR",
  "INCUBATOR",
  "COMPETITION",
  "HACKATHON",
  "TRAINING",
  "RESEARCH",
  "PARTNERSHIP",
  "INVESTMENT",
  "CONSULTANCY",
  "SUPPLIER",
  "VENDOR",
  "CALL_FOR_PROPOSALS",
  "OTHER",
]);

export const opportunityFilterSchema = z.object({
  q: z.string().trim().max(200).optional(),
  category: opportunityCategoryEnum.optional(),
  opportunityType: opportunityTypeEnum.optional(),
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

export type OpportunityFilterInput = z.infer<typeof opportunityFilterSchema>;