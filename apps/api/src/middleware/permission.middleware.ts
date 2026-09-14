import type { Request, Response, NextFunction } from "express";
import { ForbiddenError, UnauthorizedError } from "../utils/errors";
import { ROLES } from "../constants/roles";
import type { PermissionKey } from "../constants/permissions";

export function requirePermission(permissions: PermissionKey[]) {
  return function permissionMiddleware(
    req: Request,
    _res: Response,
    next: NextFunction,
  ): void {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }
    if (req.user.role === ROLES.SUPER_ADMIN) {
      next();
      return;
    }
    const granted = req.permissions ?? [];
    const missing = permissions.filter((permission) => !granted.includes(permission));
    if (missing.length > 0) {
      next(new ForbiddenError("You do not have permission to perform this action"));
      return;
    }
    next();
  };
}