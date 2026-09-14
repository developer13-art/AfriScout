import type { RoleKey } from "../constants/roles";
import type { PermissionKey } from "../constants/permissions";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      user?: {
        id: string;
        email: string;
        role: RoleKey;
      };
      apiKey?: {
        id: string;
        userId: string;
        scopes: string[];
      };
      permissions?: PermissionKey[];
      rawBody?: Buffer;
    }
  }
}

export {};