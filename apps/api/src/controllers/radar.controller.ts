import type { Request, Response } from "express";
import * as RadarService from "../services/radar/radar.service";
import { asyncHandler } from "../utils/asyncHandler";
import { UnauthorizedError } from "../utils/errors";

export const get = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const data = await RadarService.getRadar(req.user.id);
  res.json({ data });
});