import type { Request, Response, NextFunction } from "express";
import { apifyConfig } from "../config/apify";
import { verifySignature } from "../utils/signature";
import { logger } from "../config/logger";
import { UnauthorizedError } from "../utils/errors";
import { APIFY_WEBHOOK_HEADER } from "../types/apify";

/**
 * Verifies an incoming Apify webhook.
 *
 * For development and initial integration, this middleware accepts a
 * request if ANY of the following is true:
 *   1. An HMAC signature in the APIFY_WEBHOOK_HEADER matches the secret.
 *   2. A `token` query parameter matches the secret.
 *   3. A `x-apify-webhook-secret` header matches the secret.
 *   4. No secret is configured on the server (fail-open for setup phase).
 *
 * When we harden this for production, we will switch to a single
 * verified pattern and remove the fail-open branch.
 */
export function apifyWebhookSignatureMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    const expected = apifyConfig.webhookSecret;

    // Log every incoming webhook so we can see what Apify is actually sending.
    logger.info(
      {
        path: req.path,
        method: req.method,
        hasToken: typeof req.query.token === "string",
        tokenMatch:
          typeof req.query.token === "string" && expected
            ? req.query.token === expected
            : false,
        hasSignatureHeader: Boolean(req.headers[APIFY_WEBHOOK_HEADER]),
        hasApifySecretHeader: Boolean(req.headers["x-apify-webhook-secret"]),
        queryKeys: Object.keys(req.query),
        headerKeys: Object.keys(req.headers).filter((k) =>
          k.startsWith("x-") || k.startsWith("apify"),
        ),
      },
      "apify_webhook_received",
    );

    if (!expected) {
      // Setup phase: no secret configured. Accept the request so the
      // integration can be verified.
      return next();
    }

    // Path 1: HMAC signature header
    const header = req.headers[APIFY_WEBHOOK_HEADER];
    if (header && typeof header === "string" && req.rawBody) {
      if (verifySignature(req.rawBody, header, expected)) {
        return next();
      }
    }

    // Path 2: token query parameter
    const token = typeof req.query.token === "string" ? req.query.token : null;
    if (token && token === expected) {
      return next();
    }

    // Path 3: custom header
    const secretHeader = req.headers["x-apify-webhook-secret"];
    if (secretHeader && typeof secretHeader === "string" && secretHeader === expected) {
      return next();
    }

    throw new UnauthorizedError("Invalid Apify webhook credentials");
  } catch (error) {
    next(error);
  }
}