import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as GraphService from "../services/graph/graph.service";

export const getOpportunityGraph = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ data: await GraphService.getOpportunityGraph() });
});
