import type { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger";

export function requestLoggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const startedAt = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    logger.info(
      {
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        durationMs,
        userId: req.user?.id,
      },
      "http_request",
    );
  });

  next();
}