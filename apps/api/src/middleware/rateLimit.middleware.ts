import type { Request, Response, NextFunction } from "express";
import { redis } from "../config/redis";
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

  return async function rateLimitMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const key = `${keyPrefix}:${keyGenerator(req)}`;
      const now = Date.now();
      const windowStart = now - windowMs;

      const pipeline = redis.multi();
      pipeline.zremrangebyscore(key, 0, windowStart);
      pipeline.zadd(key, now, `${now}-${Math.random()}`);
      pipeline.zcard(key);
      pipeline.pexpire(key, windowMs);

      const results = await pipeline.exec();
      const count = (results?.[2]?.[1] as number | undefined) ?? 0;

      res.setHeader("X-RateLimit-Limit", max);
      res.setHeader("X-RateLimit-Remaining", Math.max(0, max - count));

      if (count > max) {
        next(new RateLimitedError("Too many requests"));
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}