import type { Request, Response } from "express";
import * as MatchService from "../services/matching/match.service";
import { ensureMatchesForUser } from "../services/matching/batchMatch.service";
import { enqueueRecomputeMatches } from "../jobs/definitions/matchUsers.job";
import { prisma } from "../config/database";
import { asyncHandler } from "../utils/asyncHandler";
import { UnauthorizedError } from "../utils/errors";

function requireUserId(req: Request): string {
  if (!req.user) throw new UnauthorizedError();
  return req.user.id;
}

export const list = asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : 50;
  const userId = requireUserId(req);
  const aiAnalysisPending = await ensureMatchesForUser(userId);
  const result = await MatchService.listMatchesForUser(userId, limit);
  res.json({ data: { ...result, aiAnalysisPending } });
});

export const forOpportunity = asyncHandler(async (req: Request, res: Response) => {
  const result = await MatchService.getMatchForOpportunity(
    requireUserId(req),
    req.params.opportunityId,
  );
  res.json({ data: result });
});

export const recompute = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const dna = await prisma.dnaProfile.findFirst({
    where: { userId, isActive: true },
    orderBy: { version: "desc" },
    select: { id: true, updatedAt: true },
  });
  if (dna) {
    await prisma.match.updateMany({
      where: { userId, dnaProfileId: dna.id },
      data: {
        aiMatchQualification: null,
        aiMatchReason: null,
        aiMatchProvider: null,
        aiMatchError: null,
        aiMatchAnalyzedAt: null,
      },
    });
    await enqueueRecomputeMatches({
      userId,
      dnaProfileId: dna.id,
      dnaUpdatedAt: dna.updatedAt.getTime(),
    });
  }
  res.status(202).json({ data: { started: Boolean(dna) } });
});