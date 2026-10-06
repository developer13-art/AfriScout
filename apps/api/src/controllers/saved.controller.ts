import type { Request, Response } from "express";
import * as SavedService from "../services/saved/saved.service";
import { asyncHandler } from "../utils/asyncHandler";
import { UnauthorizedError } from "../utils/errors";

function requireUserId(req: Request): string {
  if (!req.user) throw new UnauthorizedError();
  return req.user.id;
}

export const list = asyncHandler(async (req: Request, res: Response) => {
  const data = await SavedService.listSaved(requireUserId(req));
  res.json({ data });
});

export const add = asyncHandler(async (req: Request, res: Response) => {
  const data = await SavedService.addSaved(requireUserId(req), req.body.opportunityId);
  res.status(201).json({ data });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await SavedService.removeSaved(requireUserId(req), req.params.opportunityId);
  res.status(204).send();
});