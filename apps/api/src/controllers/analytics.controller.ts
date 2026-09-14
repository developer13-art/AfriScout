import type { Request, Response } from "express";
import * as AnalyticsService from "../services/analytics/analytics.service";
import { asyncHandler } from "../utils/asyncHandler";
import { UnauthorizedError } from "../utils/errors";

export const user = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const data = await AnalyticsService.scopedUserAnalytics(req.user.id);
  res.json({ data });
});

export const business = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const data = await AnalyticsService.scopedBusinessAnalytics(req.user.id);
  res.json({ data });
});

export const admin = asyncHandler(async (_req: Request, res: Response) => {
  const data = await AnalyticsService.scopedAdminAnalytics();
  res.json({ data });
});

export const opportunities = asyncHandler(async (_req: Request, res: Response) => {
  const data = await AnalyticsService.scopedOpportunityAnalytics();
  res.json({ data });
});