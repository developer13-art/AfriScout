import type { Request, Response } from "express";
import * as WatchlistService from "../services/watchlist/watchlist.service";
import { asyncHandler } from "../utils/asyncHandler";
import { UnauthorizedError } from "../utils/errors";

function requireUserId(req: Request): string {
  if (!req.user) throw new UnauthorizedError();
  return req.user.id;
}

export const list = asyncHandler(async (req: Request, res: Response) => {
  const data = await WatchlistService.listWatchlist(requireUserId(req));
  res.json({ data });
});

export const add = asyncHandler(async (req: Request, res: Response) => {
  const data = await WatchlistService.addToWatchlist(
    requireUserId(req),
    req.body.opportunityId,
  );
  res.status(201).json({ data });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await WatchlistService.removeFromWatchlist(
    requireUserId(req),
    req.params.opportunityId,
  );
  res.status(204).send();
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = await WatchlistService.updateWatchlist(
    requireUserId(req),
    req.params.opportunityId,
    req.body,
  );
  res.json({ data });
});