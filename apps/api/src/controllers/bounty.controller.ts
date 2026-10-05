import type { Request, Response } from "express";
import * as BountyService from "../services/bounties/bounty.service";
import { asyncHandler } from "../utils/asyncHandler";
import { UnauthorizedError } from "../utils/errors";

function userId(req: Request): string {
  if (!req.user) throw new UnauthorizedError();
  return req.user.id;
}

export const list = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ data: await BountyService.listOpenBounties() });
});

export const get = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await BountyService.getBounty(req.params.bountyId) });
});

export const byOpportunitySlug = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await BountyService.getBountyByOpportunitySlug(req.params.slug) });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json({
    data: await BountyService.createBounty({ ...req.body, userId: userId(req) }),
  });
});

export const managed = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await BountyService.listManagedBounties(userId(req)) });
});

export const mySubmission = asyncHandler(async (req: Request, res: Response) => {
  res.json({
    data: await BountyService.getMySubmission(req.params.bountyId, userId(req)),
  });
});

export const submissions = asyncHandler(async (req: Request, res: Response) => {
  res.json({
    data: await BountyService.getSubmissionQueue(req.params.bountyId, userId(req)),
  });
});

export const createAction = asyncHandler(async (req: Request, res: Response) => {
  res.json({
    data: await BountyService.createActionTransaction(
      req.params.bountyId,
      req.body.account,
    ),
  });
});

export const recordParticipation = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json({
    data: await BountyService.recordParticipation({
      bountyId: req.params.bountyId,
      userId: userId(req),
      transactionSignature: req.body.transactionSignature,
    }),
  });
});

export const submitWork = asyncHandler(async (req: Request, res: Response) => {
  res.json({
    data: await BountyService.submitWork({
      bountyId: req.params.bountyId,
      userId: userId(req),
      ...req.body,
    }),
  });
});

export const reviewSubmission = asyncHandler(async (req: Request, res: Response) => {
  res.json({
    data: await BountyService.reviewSubmission({
      bountyId: req.params.bountyId,
      submissionId: req.params.submissionId,
      userId: userId(req),
      ...req.body,
    }),
  });
});

