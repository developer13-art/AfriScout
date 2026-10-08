import type { Request, Response } from "express";
import * as MessagingService from "../services/community/communityMessaging.service";
import { asyncHandler } from "../utils/asyncHandler";
import { UnauthorizedError } from "../utils/errors";

function userId(req: Request) {
  if (!req.user?.id) throw new UnauthorizedError();
  return req.user.id;
}

export const conversations = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await MessagingService.listConversations(userId(req)) });
});

export const conversation = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await MessagingService.getConversation(userId(req), req.params.userId) });
});

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json({
    data: await MessagingService.sendMessage(userId(req), req.params.userId, req.body.body),
  });
});

export const markMessagesRead = asyncHandler(async (req: Request, res: Response) => {
  res.json({
    data: await MessagingService.markMessagesRead(userId(req), req.params.userId),
  });
});
