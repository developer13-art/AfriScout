import { z } from "zod";

export const sourceTypeEnum = z.enum([
  "GOVERNMENT",
  "PROCUREMENT_PORTAL",
  "UNIVERSITY",
  "NGO",
  "FOUNDATION",
  "ACCELERATOR",
  "GRANT_PORTAL",
  "JOB_BOARD",
  "SCHOLARSHIP_PORTAL",
  "DEVELOPMENT_ORG",
  "PRIVATE_COMPANY",
  "OTHER",
]);

export const crawlFrequencyEnum = z.enum([
  "EVERY_6_HOURS",
  "EVERY_12_HOURS",
  "DAILY",
  "WEEKLY",
  "MANUAL",
]);

export const sourceCreateSchema = z.object({
  name: z.string().trim().min(2).max(200),
  url: z.string().url(),
  adapter: z.string().trim().min(1).max(80),
  countryCode: z.string().trim().length(2).optional(),
  region: z.string().trim().max(120).optional(),
  language: z.string().trim().max(10).optional(),
  currency: z.string().trim().length(3).optional(),
  category: z.string().trim().max(60).optional(),
  sourceType: sourceTypeEnum,
  crawlFrequency: crawlFrequencyEnum.optional(),
  attributionRequired: z.boolean().optional(),
  termsUrl: z.string().url().optional(),
  notes: z.string().trim().max(4000).optional(),
  metadata: z.record(z.unknown()).optional(),
  active: z.boolean().optional(),
});

export const sourceUpdateSchema = sourceCreateSchema.partial();

export const sourceFilterSchema = z.object({
  q: z.string().trim().max(200).optional(),
  countryCode: z.string().trim().length(2).optional(),
  category: z.string().trim().max(60).optional(),
  sourceType: sourceTypeEnum.optional(),
  health: z.enum(["UNKNOWN", "HEALTHY", "WARNING", "FAILED", "INACTIVE"]).optional(),
  active: z.coerce.boolean().optional(),
  crawlFrequency: crawlFrequencyEnum.optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export const sourceSuggestionCreateSchema = z.object({
  name: z.string().trim().min(2).max(200),
  url: z.string().url(),
  countryCode: z.string().trim().length(2).optional(),
  category: z.string().trim().max(60).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const sourceSuggestionReviewSchema = z.object({
  status: z.enum(["SUGGESTED", "REVIEWED", "VERIFIED", "ACTIVATED", "REJECTED"]),
  reviewNotes: z.string().trim().max(2000).optional(),
});

export type SourceCreateInput = z.infer<typeof sourceCreateSchema>;
export type SourceUpdateInput = z.infer<typeof sourceUpdateSchema>;
export type SourceFilterInput = z.infer<typeof sourceFilterSchema>;
export type SourceSuggestionCreateInput = z.infer<typeof sourceSuggestionCreateSchema>;
export type SourceSuggestionReviewInput = z.infer<typeof sourceSuggestionReviewSchema>;