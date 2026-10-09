import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as SourceDiscovery from "../services/sources/sourceDiscovery.service";

export const overview = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ data: await SourceDiscovery.getOverview() });
});

export const listRuns = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ data: await SourceDiscovery.listRuns() });
});

export const createRun = asyncHandler(async (req: Request, res: Response) => {
  const data = await SourceDiscovery.createRun(req.body, req.user!.id);
  res.status(201).json({ data });
});

export const getRun = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await SourceDiscovery.getRun(req.params.id) });
});

export const listCandidates = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ data: await SourceDiscovery.listCandidates() });
});

export const reviewCandidate = asyncHandler(async (req: Request, res: Response) => {
  res.json({
    data: await SourceDiscovery.reviewCandidate(
      req.params.id,
      req.body,
      req.user!.id,
    ),
  });
});
