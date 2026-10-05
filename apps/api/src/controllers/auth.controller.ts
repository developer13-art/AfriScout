import type { Request, Response } from "express";
import * as AuthService from "../services/auth/auth.service";
import * as WalletAuthService from "../services/auth/walletAuth.service";
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
  if (!req.user) throw new Error("Authenticated user missing");
  const user = await AuthService.getCurrentUser(req.user.id);
  res.json({ data: user });
});

export const walletChallenge = asyncHandler(async (req: Request, res: Response) => {
  const result = await WalletAuthService.createChallenge(
    req.body.walletAddress,
    req.user?.id,
  );
  res.json({ data: result });
});

export const walletVerify = asyncHandler(async (req: Request, res: Response) => {
  const result = await WalletAuthService.verifyChallenge(
    { ...req.body, currentUserId: req.user?.id },
    {
      userAgent: req.headers["user-agent"] ?? null,
      ipAddress: req.ip ?? null,
    },
  );
  if (result.purpose === "LINK") {
    res.json({ data: { walletLinked: true, user: result.user } });
    return;
  }
  res.json({ data: result.auth });
});