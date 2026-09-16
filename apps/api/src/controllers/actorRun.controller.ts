import type { Request, Response } from "express";
import * as RunService from "../services/apify/run.service";
import * as IngestionService from "../services/apify/runIngestion.service";
import { enqueueRunApifyActor } from "../jobs/definitions/runApifyActor.job";
import { apifyActors, abortActorRun } from "../services/apify/actor.service";
import { asyncHandler } from "../utils/asyncHandler";
import { logger } from "../config/logger";

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
  const { sourceId } = req.body as { sourceId: string };
  if (!sourceId) {
    res.status(400).json({
      error: { code: "BAD_REQUEST", message: "sourceId is required" },
    });
    return;
  }
  if (!apifyActors.opportunityDiscovery) {
    res.status(503).json({
      error: {
        code: "APIFY_NOT_CONFIGURED",
        message: "Apify actor ID is not configured",
      },
    });
    return;
  }

  const run = await IngestionService.triggerIngestion({
    sourceId,
    trigger: "MANUAL_ADMIN",
    createdBy: req.user?.id ?? null,
  });

  await enqueueRunApifyActor({
    sourceId,
    runId: run.id,
    actorId: apifyActors.opportunityDiscovery,
  });

  logger.info({ sourceId, runId: run.id }, "actor_run_enqueued");
  res.status(202).json({ data: run });
});

export const abort = asyncHandler(async (req: Request, res: Response) => {
  const run = await RunService.getRun(req.params.id);
  if (run?.apifyRunId) await abortActorRun(run.apifyRunId);
  res.status(202).json({ data: { aborted: true } });
});

export const rawItems = asyncHandler(async (req: Request, res: Response) => {
  const data = await RunService.getRawItemsForRun(req.params.id);
  res.json({ data });
});