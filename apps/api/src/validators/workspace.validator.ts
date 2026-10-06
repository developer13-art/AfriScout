import { z } from "zod";

export const createWorkspaceSchema = z.object({
  type: z.literal("DEVELOPER"),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).optional(),
  useCase: z.string().trim().max(120).optional(),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
