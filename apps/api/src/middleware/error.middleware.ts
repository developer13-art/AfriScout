import type { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/httpError";

export function errorMiddleware(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  res.locals.requestId = req.requestId;
  sendError(res, error);
}

export function notFoundMiddleware(
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.originalUrl} was not found`,
      requestId: req.requestId,
    },
  });
}