import type { Request, Response } from "express";
import * as Service from "../services/analytics/publicAnalytics.service";
import { asyncHandler } from "../utils/asyncHandler";

export const totals = asyncHandler(async (_req: Request, res: Response) => {
  const data = await Service.getPublicTotals();
  res.json({ data });
});

export const countries = asyncHandler(async (_req: Request, res: Response) => {
  const data = await Service.getPublicCountryBreakdown();
  res.json({ data });
});