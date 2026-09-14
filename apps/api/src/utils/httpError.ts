import type { Response } from "express";
import { AppError } from "./errors";
import { logger } from "./logger";

export interface ErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
}

export function sendError(res: Response, error: unknown): void {
  const requestId = res.locals.requestId as string | undefined;

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        requestId,
      },
    } satisfies ErrorBody);
    return;
  }

  logger.error({ err: error, requestId }, "Unhandled error");

  res.status(500).json({
    error: {
      code: "INTERNAL",
      message: "Internal server error",
      requestId,
    },
  } satisfies ErrorBody);
}