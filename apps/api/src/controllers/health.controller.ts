import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { pingDatabase } from "../config/database";
import { apifyConfig } from "../config/apify";
import { aiConfig } from "../config/ai";
import { env } from "../config/env";

export const health = asyncHandler(async (_req: Request, res: Response) => {
  const dbOk = await pingDatabase();
  const apifyOk = apifyConfig.isConfigured;
  const aiOk = aiConfig.enabled;

  const status = dbOk ? "ok" : "degraded";

  res.status(status === "ok" ? 200 : 503).json({
    data: {
      status,
      version: "0.1.0",
      env: env.NODE_ENV,
      checks: { db: dbOk, apify: apifyOk, ai: aiOk },
      timestamp: new Date().toISOString(),
    },
  });
});

export const readiness = asyncHandler(async (_req: Request, res: Response) => {
  const dbOk = await pingDatabase();
  res.status(dbOk ? 200 : 503).json({ data: { ready: dbOk } });
});

export const liveness = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ data: { alive: true } });
});