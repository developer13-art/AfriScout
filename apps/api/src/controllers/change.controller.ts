import type { Request, Response } from "express";
import { prisma } from "../config/database";
import { asyncHandler } from "../utils/asyncHandler";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const page = req.query.page ? Number(req.query.page) : 1;
  const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 50;

  const [items, total] = await Promise.all([
    prisma.opportunityChange.findMany({
      orderBy: { detectedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.opportunityChange.count(),
  ]);

  res.json({ data: items, meta: { total, page, pageSize } });
});

export const markNotified = asyncHandler(async (req: Request, res: Response) => {
  const item = await prisma.opportunityChange.update({
    where: { id: req.params.id },
    data: { notified: true },
  });
  res.json({ data: item });
});