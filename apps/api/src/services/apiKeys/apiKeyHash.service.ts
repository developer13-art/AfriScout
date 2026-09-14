import { createHash } from "node:crypto";

export function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

export function apiKeyPrefix(rawKey: string): string {
  const parts = rawKey.split("_");
  return parts.slice(0, 2).join("_");
}