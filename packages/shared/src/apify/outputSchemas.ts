import { z } from "zod";

export const opportunityDiscoveryOutputSchema = z.object({
  title: z.string(),
  organization: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  publishedAt: z.string().nullable().optional(),
  deadline: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  sourceUrl: z.string().url(),
  sourceName: z.string().nullable().optional(),
  sourceId: z.string(),
  adapter: z.string(),
  referenceNumber: z.string().nullable().optional(),
  valueMin: z.number().nullable().optional(),
  valueMax: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  eligibility: z.string().nullable().optional(),
  requirements: z.string().nullable().optional(),
  documents: z.array(z.string()).optional(),
});

export const documentExtractorOutputSchema = z.object({
  eligibility: z.string().optional(),
  requirements: z.array(z.string()).optional(),
  documents: z.array(z.string()).optional(),
  value: z.string().optional(),
  deadline: z.string().optional(),
  notes: z.string().optional(),
});

export const opportunityMonitorOutputSchema = z.object({
  opportunityId: z.string(),
  changed: z.boolean(),
  field: z.string().optional(),
  oldValue: z.unknown().optional(),
  newValue: z.unknown().optional(),
});