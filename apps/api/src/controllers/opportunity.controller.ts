import type { Request, Response } from "express";
import * as OpportunityService from "../services/opportunities/opportunity.service";
import * as OpportunityProofService from "../services/opportunities/opportunityProof.service";
import { asyncHandler } from "../utils/asyncHandler";
import { UnauthorizedError } from "../utils/errors";

function requireUserId(req: Request): string {
  if (!req.user) throw new UnauthorizedError();
  return req.user.id;
}

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

export const createProvenanceProofTransaction = asyncHandler(async (req: Request, res: Response) => {
  res.json({
    data: await OpportunityProofService.createOpportunityProofTransaction(
      req.params.id,
      requireUserId(req),
      req.body.account,
    ),
  });
});

export const confirmProvenanceProof = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json({
    data: await OpportunityProofService.recordOpportunityProof(
      req.params.id,
      requireUserId(req),
      req.body.transactionSignature,
    ),
  });
});