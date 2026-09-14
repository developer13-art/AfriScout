import type { Request, Response } from "express";
import * as MatchService from "../services/matching/match.service";
import { asyncHandler } from "../utils/asyncHandler";
import { UnauthorizedError } from "../utils/errors";

function requireUserId(req: Request): string {
  if (!req.user) throw new UnauthorizedError();
  return req.user.id;
}

export const list = asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : 50;
  const result = await MatchService.listMatchesForUser(requireUserId(req), limit);
  res.json({ data: result });
});

export const forOpportunity = asyncHandler(async (req: Request, res: Response) => {
  const result = await MatchService.getMatchForOpportunity(
    requireUserId(req),
    req.params.opportunityId,
  );
  res.json({ data: result });
});

export const recompute = asyncHandler(async (req: Request, res: Response) => {
  const { recomputeMatchesForUser } = await import("../services/matching/batchMatch.service");
  await recomputeMatchesForUser(requireUserId(req));
  res.status(202).json({ data: { started: true } });
});