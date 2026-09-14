import type { Request, Response, NextFunction } from "express";
import { APIFY_WEBHOOK_HEADER } from "../types/apify";
import { apifyConfig } from "../config/apify";
import { verifySignature } from "../utils/signature";
import { UnauthorizedError } from "../utils/errors";

export function apifyWebhookSignatureMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    const header = req.headers[APIFY_WEBHOOK_HEADER];
    if (!header || typeof header !== "string") {
      throw new UnauthorizedError("Missing Apify webhook signature");
    }

    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new UnauthorizedError("Missing raw body for signature verification");
    }

    const ok = verifySignature(rawBody, header, apifyConfig.webhookSecret);
    if (!ok) {
      throw new UnauthorizedError("Apify webhook signature is invalid");
    }

    next();
  } catch (error) {
    next(error);
  }
}