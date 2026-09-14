import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../services/auth/token.service";
import { UnauthorizedError } from "../utils/errors";
import { prisma } from "../config/database";
import type { RoleKey } from "../constants/roles";
import { ROLE_PERMISSIONS } from "../constants/permissions";

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw new UnauthorizedError("Missing bearer token");
    }

    const token = header.slice("Bearer ".length).trim();
    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, status: true },
    });

    if (!user || user.status !== "ACTIVE") {
      throw new UnauthorizedError("Account is not active");
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role as RoleKey,
    };
    req.permissions = ROLE_PERMISSIONS[user.role as RoleKey] ?? [];

    next();
  } catch (error) {
    next(error instanceof UnauthorizedError ? error : new UnauthorizedError());
  }
}

export async function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    next();
    return;
  }
  authMiddleware(req, res, next);
}