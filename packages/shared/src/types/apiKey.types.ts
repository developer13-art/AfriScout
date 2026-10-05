export type ApiKeyScopeKey =
  | "opportunities:read"
  | "opportunities:write"
  | "sources:read"
  | "matches:read"
  | "analytics:read"
  | "webhooks:manage";

export interface ApiKeyDTO {
  id: string;
  userId: string;
  name: string;
  prefix: string;
  scopes: ApiKeyScopeKey[];
  rateLimitPerMin: number;
  lastUsedAt?: string | null;
  expiresAt?: string | null;
  revokedAt?: string | null;
  createdAt: string;
}

export interface ApiKeyCreateResultDTO {
  apiKey: ApiKeyDTO;
  plainTextKey: string;
}