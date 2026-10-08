import { z } from "zod";

export const dnaPatchSchema = z.object({
  industries: z.array(z.string().trim().min(1).max(120)).max(50).optional(),
  capabilities: z.array(z.string().trim().min(1).max(120)).max(100).optional(),
  sectors: z.array(z.string().trim().min(1).max(120)).max(50).optional(),
  preferredCountries: z.array(z.string().trim().length(2)).max(60).optional(),
  preferredLocations: z.array(z.string().trim().min(1).max(120)).max(100).optional(),
  remotePreference: z.enum(["ONSITE", "REMOTE", "HYBRID", "ANY"]).optional(),
  currency: z.string().trim().length(3).optional(),
  minValue: z.number().nonnegative().nullable().optional(),
  maxValue: z.number().nonnegative().nullable().optional(),
  eligibilityNotes: z.string().trim().max(4000).optional(),
  experienceNotes: z.string().trim().max(4000).optional(),
  opportunityTypes: z.array(z.string().trim().min(1).max(60)).max(50).optional(),
  opportunityCategories: z.array(z.string().trim().min(1).max(60)).max(50).optional(),
  keywords: z.array(z.string().trim().min(1).max(60)).max(100).optional(),
});

export const dnaCreateSchema = dnaPatchSchema.required({
  industries: true,
  capabilities: true,
  sectors: true,
  preferredCountries: true,
  preferredLocations: true,
  remotePreference: true,
  currency: true,
  opportunityTypes: true,
  opportunityCategories: true,
  keywords: true,
});

export type DnaPatchInput = z.infer<typeof dnaPatchSchema>;
export type DnaCreateInput = z.infer<typeof dnaCreateSchema>;