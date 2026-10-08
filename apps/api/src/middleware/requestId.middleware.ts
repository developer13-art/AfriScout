import { randomUUID } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

const HEADER = "x-request-id";

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const incoming = req.headers[HEADER];
  const requestId =
    typeof incoming === "string" && incoming.length > 0 ? incoming : randomUUID();
  req.requestId = requestId;
  res.locals.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);
  next();
}