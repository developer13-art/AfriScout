import { z } from "zod";

export const opportunityDiscoveryInputSchema = z.object({
  sourceId: z.string(),
  sourceUrl: z.string().url(),
  sourceType: z.string(),
  country: z.string().length(2).optional(),
  category: z.string().optional(),
  adapter: z.string(),
  maxItems: z.number().int().positive().max(5000).optional(),
  requestTimeoutSeconds: z.number().int().positive().max(3600).optional(),
});

export const documentExtractorInputSchema = z.object({
  documentUrl: z.string().url(),
  mimeType: z.string().optional(),
  language: z.string().optional(),
});

export const opportunityMonitorInputSchema = z.object({
  opportunityId: z.string(),
  sourceUrl: z.string().url(),
  adapter: z.string(),
});