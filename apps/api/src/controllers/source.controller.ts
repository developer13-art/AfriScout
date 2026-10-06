import type { Request, Response } from "express";
import * as SourceService from "../services/sources/source.service";
import * as SourceTest from "../services/sources/sourceTest.service";
import * as SourceSuggestion from "../services/sources/sourceSuggestion.service";
import * as AdapterService from "../services/apify/adapterRegistry.service";
import * as HealthService from "../services/sources/sourceHealth.service";
import { asyncHandler } from "../utils/asyncHandler";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await SourceService.listSources(req.query as never);
  res.json({ data: result.items });
});

export const get = asyncHandler(async (req: Request, res: Response) => {
  const data = await SourceService.getSourceById(req.params.id);
  res.json({ data });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = await SourceService.createSource(req.body, req.user?.id ?? null);
  res.status(201).json({ data });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = await SourceService.updateSource(req.params.id, req.body);
  res.json({ data });
});

export const activate = asyncHandler(async (req: Request, res: Response) => {
  const data = await SourceService.activateSource(req.params.id);
  res.json({ data });
});

export const deactivate = asyncHandler(async (req: Request, res: Response) => {
  const data = await SourceService.deactivateSource(req.params.id);
  res.json({ data });
});

export const test = asyncHandler(async (req: Request, res: Response) => {
  const data = await SourceTest.testSource(req.params.id);
  res.json({ data });
});

export const adapters = asyncHandler(async (_req: Request, res: Response) => {
  const data = await AdapterService.listAdapters();
  res.json({ data });
});

export const health = asyncHandler(async (_req: Request, res: Response) => {
  const data = await HealthService.healthOverview();
  res.json({ data });
});

export const listSuggestions = asyncHandler(async (_req: Request, res: Response) => {
  const data = await SourceSuggestion.listSuggestions();
  res.json({ data });
});

export const createSuggestion = asyncHandler(async (req: Request, res: Response) => {
  const data = await SourceSuggestion.createSuggestion(
    req.body,
    req.user?.id ?? null,
  );
  res.status(201).json({ data });
});

export const reviewSuggestion = asyncHandler(async (req: Request, res: Response) => {
  const data = await SourceSuggestion.reviewSuggestion(
    req.params.id,
    req.body,
    req.user!.id,
  );
  res.json({ data });
});