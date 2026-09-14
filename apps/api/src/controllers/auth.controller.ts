import type { Request, Response } from "express";
import * as AuthService from "../services/auth/auth.service";
import { asyncHandler } from "../utils/asyncHandler";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await AuthService.register(req.body, {
    userAgent: req.headers["user-agent"] ?? null,
    ipAddress: req.ip ?? null,
  });
  res.status(201).json({ data: result });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await AuthService.login(req.body, {
    userAgent: req.headers["user-agent"] ?? null,
    ipAddress: req.ip ?? null,
  });
  res.json({ data: result });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const result = await AuthService.refresh(req.body, {
    userAgent: req.headers["user-agent"] ?? null,
    ipAddress: req.ip ?? null,
  });
  res.json({ data: result });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  if (req.body?.refreshToken) {
    await AuthService.logout(req.body.refreshToken);
  }
  res.status(204).send();
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: req.user });
});