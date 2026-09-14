import { z } from "zod";

export const searchBodySchema = z.object({
  q: z.string().trim().min(2).max(200),
  filters: z.record(z.unknown()).optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export const searchIntentBodySchema = z.object({
  q: z.string().trim().min(2).max(200),
});