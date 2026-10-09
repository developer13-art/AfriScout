import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { RateLimitedError } from "../utils/errors";

export interface RateLimitOptions {
  windowMs?: number;
  max?: number;
  keyPrefix?: string;
  keyGenerator?: (req: Request) => string;
}

function defaultKeyGenerator(req: Request): string {
  if (req.user) return `user:${req.user.id}`;
  if (req.apiKey) return `key:${req.apiKey.id}`;
  return `ip:${req.ip ?? "unknown"}`;
}

export function rateLimit(options: RateLimitOptions = {}) {
  const windowMs = options.windowMs ?? env.RATE_LIMIT_WINDOW_MS;
  const max = options.max ?? env.RATE_LIMIT_MAX;
  const keyPrefix = options.keyPrefix ?? "rate";
  const keyGenerator = options.keyGenerator ?? defaultKeyGenerator;
  const requestsByKey = new Map<string, number[]>();
  const cleanupIntervalMs = Math.min(windowMs, 60_000);
  let lastCleanupAt = 0;

  return async function rateLimitMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const now = Date.now();
    if (now - lastCleanupAt >= cleanupIntervalMs) {
      const expiredBefore = now - windowMs;
      for (const [key, timestamps] of requestsByKey) {
        let firstActive = 0;
        while (
          firstActive < timestamps.length &&
          timestamps[firstActive] !== undefined &&
          timestamps[firstActive] <= expiredBefore
        ) {
          firstActive += 1;
        }

        if (firstActive === timestamps.length) {
          requestsByKey.delete(key);
        } else if (firstActive > 0) {
          requestsByKey.set(key, timestamps.slice(firstActive));
        }
      }
      lastCleanupAt = now;
    }

    const key = `${keyPrefix}:${keyGenerator(req)}`;
    const expiredBefore = now - windowMs;
    const timestamps = requestsByKey.get(key) ?? [];
    let firstActive = 0;
    while (
      firstActive < timestamps.length &&
      timestamps[firstActive] !== undefined &&
      timestamps[firstActive] <= expiredBefore
    ) {
      firstActive += 1;
    }

    const activeTimestamps =
      firstActive > 0 ? timestamps.slice(firstActive) : timestamps;
    activeTimestamps.push(now);
    requestsByKey.set(key, activeTimestamps);
    const count = activeTimestamps.length;

    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, max - count));

    if (count > max) {
      next(new RateLimitedError("Too many requests"));
      return;
    }

    next();
  };
}