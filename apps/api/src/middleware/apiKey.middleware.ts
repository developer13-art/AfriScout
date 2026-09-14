import type { Request, Response, NextFunction } from "express";
import { prisma } from "../config/database";
import { hashApiKey } from "../services/apiKeys/apiKeyHash.service";
import { UnauthorizedError } from "../utils/errors";
import type { ApiKeyScope } from "../types/apiKey";

export function requireApiKey(scopes: ApiKeyScope[] = []) {
  return async function apiKeyMiddleware(
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const header = req.headers.authorization ?? req.headers["x-api-key"];
      if (!header || typeof header !== "string") {
        throw new UnauthorizedError("Missing API key");
      }
      const raw = header.startsWith("Bearer ")
        ? header.slice("Bearer ".length).trim()
        : header.trim();

      const keyHash = hashApiKey(raw);
      const record = await prisma.apiKey.findUnique({
        where: { keyHash },
        select: {
          id: true,
          userId: true,
          scopes: true,
          rateLimitPerMin: true,
          revokedAt: true,
        },
      });

      if (!record || record.revokedAt) {
        throw new UnauthorizedError("Invalid or revoked API key");
      }

      const keyScopes = (record.scopes ?? []) as ApiKeyScope[];
      const hasAll = scopes.every((scope) => keyScopes.includes(scope));
      if (scopes.length > 0 && !hasAll) {
        throw new UnauthorizedError("API key is missing required scopes");
      }

      req.apiKey = {
        id: record.id,
        userId: record.userId,
        scopes: keyScopes,
      };

      await prisma.apiKey.update({
        where: { id: record.id },
        data: { lastUsedAt: new Date() },
      });

      next();
    } catch (error) {
      next(error);
    }
  };
}