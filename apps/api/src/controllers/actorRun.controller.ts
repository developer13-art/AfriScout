import type { Request, Response } from "express";
import * as RunService from "../services/apify/run.service";
import * as IngestionService from "../services/apify/runIngestion.service";
import { asyncHandler } from "../utils/asyncHandler";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await RunService.listRuns({
    sourceId: typeof req.query.sourceId === "string" ? req.query.sourceId : undefined,
    status: typeof req.query.status === "string" ? (req.query.status as never) : undefined,
    trigger: typeof req.query.trigger === "string" ? (req.query.trigger as never) : undefined,
    page: req.query.page ? Number(req.query.page) : 1,
    pageSize: req.query.pageSize ? Number(req.query.pageSize) : 20,
  });
  res.json({ data: result.items });
});

export const get = asyncHandler(async (req: Request, res: Response) => {
  const data = await RunService.getRun(req.params.id);
  res.json({ data });
});

export const trigger = asyncHandler(async (req: Request, res: Response) => {
  const data = await IngestionService.triggerIngestion({
    sourceId: req.body.sourceId,
    trigger: "MANUAL_ADMIN",
    createdBy: req.user?.id ?? null,
  });
  res.status(202).json({ data });
});

export const abort = asyncHandler(async (req: Request, res: Response) => {
  const { abortActorRun } = await import("../services/apify/actor.service");
  const run = await RunService.getRun(req.params.id);
  if (run?.apifyRunId) await abortActorRun(run.apifyRunId);
  res.status(202).json({ data: { aborted: true } });
});

export const rawItems = asyncHandler(async (req: Request, res: Response) => {
  const data = await RunService.getRawItemsForRun(req.params.id);
  res.json({ data });
});