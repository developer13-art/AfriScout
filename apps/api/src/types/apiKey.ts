export type ApiKeyScope =
  | "opportunities:read"
  | "opportunities:write"
  | "sources:read"
  | "matches:read"
  | "analytics:read"
  | "webhooks:manage";

export interface ApiKeyRecord {
  id: string;
  userId: string;
  name: string;
  prefix: string;
  keyHash: string;
  scopes: ApiKeyScope[];
  rateLimitPerMin: number;
  lastUsedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export interface ApiKeyCreateInput {
  userId: string;
  name: string;
  scopes: ApiKeyScope[];
  expiresAt?: string | null;
}

export interface ApiKeyCreateResult {
  apiKey: ApiKeyRecord;
  plainTextKey: string;
}

export interface ApiKeyContext {
  id: string;
  userId: string;
  scopes: ApiKeyScope[];
  rateLimitPerMin: number;
}