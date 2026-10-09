import type { Request, Response } from "express";
import { prisma } from "../config/database";
import { asyncHandler } from "../utils/asyncHandler";
import { generateRandomString } from "../utils/crypto";
import { hashApiKey } from "../services/apiKeys/apiKeyHash.service";
import { UnauthorizedError } from "../utils/errors";
import { deliverWebhook } from "../services/webhooks/outboundWebhook.service";

function requireUserId(req: Request): string {
  if (!req.user) throw new UnauthorizedError();
  return req.user.id;
}

export const listEndpoints = asyncHandler(async (req: Request, res: Response) => {
  const data = await prisma.webhookEndpoint.findMany({
    where: { userId: requireUserId(req) },
    orderBy: { createdAt: "desc" },
  });
  res.json({ data });
});

export const createEndpoint = asyncHandler(async (req: Request, res: Response) => {
  const secret = generateRandomString(32);
  const data = await prisma.webhookEndpoint.create({
    data: {
      userId: requireUserId(req),
      url: req.body.url,
      events: req.body.events,
      secretHash: hashApiKey(secret),
    },
  });
  res.status(201).json({ data: { ...data, plainSecret: secret } });
});

export const updateEndpoint = asyncHandler(async (req: Request, res: Response) => {
  const data = await prisma.webhookEndpoint.updateMany({
    where: { id: req.params.id, userId: requireUserId(req) },
    data: {
      url: req.body.url,
      events: req.body.events,
      active: req.body.active,
    },
  });
  res.json({ data });
});

export const deleteEndpoint = asyncHandler(async (req: Request, res: Response) => {
  await prisma.webhookEndpoint.deleteMany({
    where: { id: req.params.id, userId: requireUserId(req) },
  });
  res.status(204).send();
});

export const listDeliveries = asyncHandler(async (req: Request, res: Response) => {
  const endpointId = typeof req.query.endpointId === "string" ? req.query.endpointId : undefined;
  const data = await prisma.webhookDelivery.findMany({
    where: endpointId
      ? { endpointId, endpoint: { userId: requireUserId(req) } }
      : { endpoint: { userId: requireUserId(req) } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  res.json({ data });
});

export const retry = asyncHandler(async (req: Request, res: Response) => {
  await deliverWebhook(req.params.id);
  res.status(202).json({ data: { retried: true } });
});