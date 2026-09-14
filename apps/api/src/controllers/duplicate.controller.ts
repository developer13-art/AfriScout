import type { Request, Response } from "express";
import { prisma } from "../config/database";
import { asyncHandler } from "../utils/asyncHandler";

export const list = asyncHandler(async (_req: Request, res: Response) => {
  const duplicates = await prisma.opportunityDuplicate.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const canonicalIds = duplicates.map((d) => d.canonicalId);
  const candidateIds = duplicates.map((d) => d.candidateId);
  const opportunities = await prisma.opportunity.findMany({
    where: { id: { in: [...canonicalIds, ...candidateIds] } },
  });
  const map: Record<string, (typeof opportunities)[number]> = {};
  for (const o of opportunities) map[o.id] = o;

  const payload = duplicates.map((d) => ({
    id: d.id,
    canonical: map[d.canonicalId],
    candidate: map[d.candidateId],
    similarity: Number(d.similarity),
    status: d.status,
  }));

  res.json({ data: payload });
});

export const merge = asyncHandler(async (req: Request, res: Response) => {
  const data = await prisma.opportunityDuplicate.update({
    where: { id: req.params.id },
    data: { status: "MERGED", reviewedAt: new Date(), reviewedBy: req.user?.id ?? null },
  });
  res.json({ data });
});

export const separate = asyncHandler(async (req: Request, res: Response) => {
  const data = await prisma.opportunityDuplicate.update({
    where: { id: req.params.id },
    data: { status: "SEPARATE", reviewedAt: new Date(), reviewedBy: req.user?.id ?? null },
  });
  res.json({ data });
});

export const ignore = asyncHandler(async (req: Request, res: Response) => {
  const data = await prisma.opportunityDuplicate.update({
    where: { id: req.params.id },
    data: { status: "IGNORED", reviewedAt: new Date(), reviewedBy: req.user?.id ?? null },
  });
  res.json({ data });
});