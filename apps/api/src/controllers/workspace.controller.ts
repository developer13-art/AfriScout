import type { Request, Response } from "express";
import * as WorkspaceService from "../services/users/workspace.service";
import { asyncHandler } from "../utils/asyncHandler";
import { UnauthorizedError } from "../utils/errors";

export const listMine = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  res.json({ data: await WorkspaceService.listWorkspacesForUser(req.user.id) });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const workspace = await WorkspaceService.createWorkspace(req.user.id, req.body);
  res.status(201).json({ data: workspace });
});
