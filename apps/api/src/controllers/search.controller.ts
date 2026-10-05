import type { Request, Response } from "express";
import * as SearchService from "../services/opportunities/search.service";
import * as SearchIntent from "../services/ai/searchIntent.service";
import { asyncHandler } from "../utils/asyncHandler";

export const search = asyncHandler(async (req: Request, res: Response) => {
  const result = await SearchService.searchOpportunities(req.body);
  res.json({ data: result });
});

export const intent = asyncHandler(async (req: Request, res: Response) => {
  const result = await SearchIntent.parseSearchIntent(req.body.q);
  res.json({ data: result });
});