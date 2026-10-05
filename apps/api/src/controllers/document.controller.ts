import type { Request, Response } from "express";
import * as DocumentService from "../services/documents/document.service";
import { asyncHandler } from "../utils/asyncHandler";

export const listByOpportunity = asyncHandler(async (req: Request, res: Response) => {
  const data = await DocumentService.listDocumentsByOpportunity(req.params.opportunityId);
  res.json({ data });
});

export const reprocess = asyncHandler(async (req: Request, res: Response) => {
  const doc = await DocumentService.getDocument(req.params.id);
  const updated = await DocumentService.markExtractionResult(doc.id, "PENDING");
  res.json({ data: updated });
});