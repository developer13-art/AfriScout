import { http } from "./http";
import type { CreateDeveloperWorkspace, Workspace } from "../types/workspace";

export const workspaceService = {
  list: () => http<Workspace[]>("/workspaces"),
  create: (input: CreateDeveloperWorkspace) =>
    http<Workspace>("/workspaces", {
      method: "POST",
      body: JSON.stringify(input),
    }),
};
