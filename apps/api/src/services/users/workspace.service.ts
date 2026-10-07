import { prisma } from "../../config/database";
import type { CreateWorkspaceInput } from "../../validators/workspace.validator";

export async function listWorkspacesForUser(userId: string) {
  return prisma.workspace.findMany({
    where: {
      OR: [
        { ownerUserId: userId },
        { organization: { is: { members: { some: { userId } } } } },
      ],
    },
    orderBy: [{ type: "asc" }, { createdAt: "asc" }],
  });
}

export async function createWorkspace(userId: string, input: CreateWorkspaceInput) {
  return prisma.workspace.create({
    data: {
      ownerUserId: userId,
      type: input.type,
      name: input.name,
      description: input.description ?? null,
      useCase: input.useCase ?? null,
    },
  });
}
