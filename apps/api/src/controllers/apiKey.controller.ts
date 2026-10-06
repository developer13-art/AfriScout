import type { Request, Response } from "express";
import * as ApiKeyService from "../services/apiKeys/apiKey.service";
import { asyncHandler } from "../utils/asyncHandler";
import { UnauthorizedError } from "../utils/errors";

function requireUserId(req: Request): string {
  if (!req.user) throw new UnauthorizedError();
  return req.user.id;
}

export const list = asyncHandler(async (req: Request, res: Response) => {
  const data = await ApiKeyService.listApiKeys(requireUserId(req));
  res.json({ data });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const result = await ApiKeyService.createApiKey({
    userId: requireUserId(req),
    name: req.body.name,
    scopes: req.body.scopes,
    expiresAt: req.body.expiresAt ?? null,
  });
  res.status(201).json({ data: result });
});

export const revoke = asyncHandler(async (req: Request, res: Response) => {
  await ApiKeyService.revokeApiKey(requireUserId(req), req.params.id);
  res.status(204).send();
});