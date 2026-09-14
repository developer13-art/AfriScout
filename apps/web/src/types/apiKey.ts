export type ApiKeyScope =
  | "opportunities:read"
  | "opportunities:write"
  | "sources:read"
  | "matches:read"
  | "analytics:read"
  | "webhooks:manage";

export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  prefix: string;
  scopes: ApiKeyScope[];
  rateLimitPerMin: number;
  lastUsedAt?: string | null;
  expiresAt?: string | null;
  revokedAt?: string | null;
  createdAt: string;
}

export interface ApiKeyCreationResult {
  apiKey: ApiKey;
  plainTextKey: string;
}

export interface ApiKeyUsageDaily {
  id: string;
  apiKeyId: string;
  day: string;
  requests: number;
  errors: number;
}