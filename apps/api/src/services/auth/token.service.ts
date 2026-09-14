import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import { env } from "../../config/env";
import { UnauthorizedError } from "../../utils/errors";
import type { RoleKey } from "../../constants/roles";

export interface AccessTokenPayload extends JwtPayload {
  sub: string;
  email: string;
  role: RoleKey;
}

export interface RefreshTokenPayload extends JwtPayload {
  sub: string;
  sid: string;
}

function signOptions(expiresIn: string): SignOptions {
  return {
    expiresIn: expiresIn as SignOptions["expiresIn"],
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
    algorithm: "HS256",
  };
}

export function signAccessToken(input: {
  userId: string;
  email: string;
  role: RoleKey;
}): string {
  return jwt.sign(
    { sub: input.userId, email: input.email, role: input.role },
    env.JWT_ACCESS_SECRET,
    signOptions(env.JWT_ACCESS_EXPIRES_IN),
  );
}

export function signRefreshToken(input: { userId: string; sessionId: string }): string {
  return jwt.sign(
    { sub: input.userId, sid: input.sessionId },
    env.JWT_REFRESH_SECRET,
    signOptions(env.JWT_REFRESH_EXPIRES_IN),
  );
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
      algorithms: ["HS256"],
    });
    if (typeof payload === "string") {
      throw new UnauthorizedError("Malformed access token");
    }
    const p = payload as AccessTokenPayload;
    if (!p.sub || !p.email || !p.role) {
      throw new UnauthorizedError("Incomplete access token");
    }
    return p;
  } catch {
    throw new UnauthorizedError("Invalid or expired access token");
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET, {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
      algorithms: ["HS256"],
    });
    if (typeof payload === "string") {
      throw new UnauthorizedError("Malformed refresh token");
    }
    const p = payload as RefreshTokenPayload;
    if (!p.sub || !p.sid) {
      throw new UnauthorizedError("Incomplete refresh token");
    }
    return p;
  } catch {
    throw new UnauthorizedError("Invalid or expired refresh token");
  }
}

export function expiresInMs(expiresIn: string): number {
  const match = /^(\d+)\s*(ms|s|m|h|d)$/.exec(expiresIn.trim());
  if (!match) throw new Error(`Invalid duration string: ${expiresIn}`);
  const value = Number(match[1]);
  const unit = match[2];
  const factor =
    unit === "ms" ? 1
      : unit === "s" ? 1000
        : unit === "m" ? 60_000
          : unit === "h" ? 3_600_000
            : 86_400_000;
  return value * factor;
}