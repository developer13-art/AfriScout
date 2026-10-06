export type WorkspaceType = "PERSONAL" | "ORGANIZATION" | "DEVELOPER";

export interface Workspace {
  id: string;
  ownerUserId: string;
  type: WorkspaceType;
  name: string;
  description?: string | null;
  useCase?: string | null;
  organizationId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeveloperWorkspace {
  type: "DEVELOPER";
  name: string;
  description?: string;
  useCase?: string;
}
