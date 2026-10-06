import type { Request, Response } from "express";
import * as NotificationService from "../services/notifications/notification.service";
import { asyncHandler } from "../utils/asyncHandler";
import { UnauthorizedError } from "../utils/errors";

function requireUserId(req: Request): string {
  if (!req.user) throw new UnauthorizedError();
  return req.user.id;
}

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await NotificationService.listNotifications({
    userId: requireUserId(req),
    page: req.query.page ? Number(req.query.page) : 1,
    pageSize: req.query.pageSize ? Number(req.query.pageSize) : 30,
  });
  res.json({ data: result.items });
});

export const unreadCount = asyncHandler(async (req: Request, res: Response) => {
  const count = await NotificationService.unreadCount(requireUserId(req));
  res.json({ data: { count } });
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  await NotificationService.markRead(requireUserId(req), req.params.id);
  res.status(204).send();
});

export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  await NotificationService.markAllRead(requireUserId(req));
  res.status(204).send();
});

export const preferences = asyncHandler(async (req: Request, res: Response) => {
  const data = await NotificationService.listPreferences(requireUserId(req));
  res.json({ data });
});

export const updatePreference = asyncHandler(async (req: Request, res: Response) => {
  const data = await NotificationService.updatePreference({
    userId: requireUserId(req),
    channel: req.body.channel,
    type: req.body.type,
    enabled: req.body.enabled,
  });
  res.json({ data });
});