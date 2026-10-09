import type { Request, Response } from "express";
import * as DnaService from "../services/dna/dna.service";
import { validateDnaCreate } from "../services/dna/dnaValidator.service";
import { asyncHandler } from "../utils/asyncHandler";
import { UnauthorizedError } from "../utils/errors";

function requireUserId(req: Request): string {
  if (!req.user) throw new UnauthorizedError();
  return req.user.id;
}

export const getActive = asyncHandler(async (req: Request, res: Response) => {
  const dna = await DnaService.getActiveDna(requireUserId(req));
  res.json({ data: dna });
});

export const listVersions = asyncHandler(async (req: Request, res: Response) => {
  const versions = await DnaService.listDnaVersions(requireUserId(req));
  res.json({ data: versions });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  validateDnaCreate(req.body);
  const dna = await DnaService.createDna(requireUserId(req), req.body);
  res.status(201).json({ data: dna });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const dna = await DnaService.updateActiveDna(requireUserId(req), req.body);
  res.json({ data: dna });
});

export const archive = asyncHandler(async (req: Request, res: Response) => {
  const dna = await DnaService.archiveActiveDna(requireUserId(req));
  res.json({ data: dna });
});