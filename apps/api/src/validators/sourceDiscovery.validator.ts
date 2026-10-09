import { z } from "zod";

export const discoveryScopeEnum = z.enum([
  "GLOBAL",
  "AFRICA",
  "NORTH_AMERICA",
  "EUROPE",
  "ASIA",
  "SOUTH_AMERICA",
  "OCEANIA",
  "CUSTOM",
]);

export const sourceDiscoveryInputSchema = z.object({
  scope: discoveryScopeEnum,
  countries: z.array(z.string().trim().min(2).max(80)).max(30).default([]),
  categories: z.array(z.string().trim().min(2).max(80)).max(20).default([]),
  sourceTypes: z.array(z.string().trim().min(2).max(80)).max(20).default([]),
  minimumScore: z.number().int().min(0).max(100).default(60),
}).superRefine((input, context) => {
  if (input.scope === "CUSTOM" && input.countries.length === 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["countries"],
      message: "Add at least one country when using a custom scope",
    });
  }
});

export const sourceCandidateReviewSchema = z.object({
  action: z.enum(["APPROVE", "REJECT", "IGNORE", "KEEP_SEPARATE", "MERGE"]),
  mergeSourceId: z.string().uuid().optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const discoveryRunParamsSchema = z.object({
  id: z.string().uuid(),
});

export const sourceCandidateParamsSchema = z.object({
  id: z.string().uuid(),
});

export type SourceDiscoveryInput = {
  scope: z.infer<typeof discoveryScopeEnum>;
  countries: string[];
  categories: string[];
  sourceTypes: string[];
  minimumScore: number;
};
export type SourceCandidateReviewInput = z.infer<typeof sourceCandidateReviewSchema>;
