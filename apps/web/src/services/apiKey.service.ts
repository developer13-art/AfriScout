import { http } from "./http";
import type { ApiKey, ApiKeyCreationResult } from "../types/apiKey";

export const apiKeyService = {
  list: () => http<ApiKey[]>("/api-keys"),
  create: (name: string, scopes: string[]) =>
    http<ApiKeyCreationResult>("/api-keys", {
      method: "POST",
      body: JSON.stringify({ name, scopes }),
    }),
  revoke: (id: string) => http<void>(`/api-keys/${id}`, { method: "DELETE" }),
};