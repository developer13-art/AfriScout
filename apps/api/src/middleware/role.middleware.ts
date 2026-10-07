import type { Request, Response, NextFunction } from "express";
import { ForbiddenError, UnauthorizedError } from "../utils/errors";
import type { RoleKey } from "../constants/roles";

export function requireRole(roles: RoleKey[]) {
  return function roleMiddleware(
    req: Request,
    _res: Response,
    next: NextFunction,
  ): void {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new ForbiddenError("Your role cannot perform this action"));
      return;
    }
    next();
  };
}