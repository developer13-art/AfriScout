import type { Request, Response } from "express";
import * as OpportunityService from "../services/opportunities/opportunity.service";
import { asyncHandler } from "../utils/asyncHandler";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await OpportunityService.listOpportunities(req.query as never);
  res.json({ data: result });
});

export const getBySlug = asyncHandler(async (req: Request, res: Response) => {
  const opportunity = await OpportunityService.getOpportunityBySlug(req.params.slug);
  res.json({ data: opportunity });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const opportunity = await OpportunityService.getOpportunityById(req.params.id);
  res.json({ data: opportunity });
});

export const requirements = asyncHandler(async (req: Request, res: Response) => {
  const items = await OpportunityService.listOpportunityRequirements(req.params.id);
  res.json({ data: items });
});

export const documents = asyncHandler(async (req: Request, res: Response) => {
  const items = await OpportunityService.listOpportunityDocuments(req.params.id);
  res.json({ data: items });
});

export const sources = asyncHandler(async (req: Request, res: Response) => {
  const items = await OpportunityService.listOpportunitySources(req.params.id);
  res.json({ data: items });
});

export const changes = asyncHandler(async (req: Request, res: Response) => {
  const items = await OpportunityService.listOpportunityChanges(req.params.id);
  res.json({ data: items });
});