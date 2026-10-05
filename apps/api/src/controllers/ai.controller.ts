import type { Request, Response } from "express";
import * as SummaryService from "../services/ai/summary.service";
import * as AnalystService from "../services/ai/analyst.service";
import * as SearchIntent from "../services/ai/searchIntent.service";
import * as OpportunityService from "../services/opportunities/opportunity.service";
import { asyncHandler } from "../utils/asyncHandler";
import { UnauthorizedError } from "../utils/errors";

export const summary = asyncHandler(async (req: Request, res: Response) => {
  const opportunity = await OpportunityService.getOpportunityById(req.params.id);
  const data = await SummaryService.summarizeOpportunity({
    title: opportunity.title,
    description: opportunity.description,
    eligibility: opportunity.eligibility,
    requirements: opportunity.requirements,
    opportunityId: opportunity.id,
  });
  res.json({ data });
});

export const analyst = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const data = await AnalystService.analyseOpportunityForUserById({
    userId: req.user.id,
    opportunityId: req.params.id,
  });
  res.json({ data });
});

export const ask = asyncHandler(async (req: Request, res: Response) => {
  const data = await SearchIntent.parseSearchIntent(req.body.query);
  res.json({ data });
});