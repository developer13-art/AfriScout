import { env } from "../config/env";
import { useAuthStore } from "../stores/authStore";

export interface HttpOptions extends RequestInit {
  auth?: boolean;
  query?: Record<string, string | number | boolean | undefined | null>;
}

export class HttpError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.details = details;
  }
}

function buildUrl(path: string, query?: HttpOptions["query"]): string {
  const base = path.startsWith("http") ? path : `${env.apiUrl}${path.startsWith("/") ? path : `/${path}`}`;
  if (!query) return base;
  const url = new URL(base);
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}

export async function http<T = unknown>(
  path: string,
  { auth = true, query, headers, ...rest }: HttpOptions = {},
): Promise<T> {
  const url = buildUrl(path, query);

  const finalHeaders = new Headers(headers);
  if (!finalHeaders.has("Content-Type") && rest.body) {
    finalHeaders.set("Content-Type", "application/json");
  }
  if (!finalHeaders.has("Accept")) {
    finalHeaders.set("Accept", "application/json");
  }

  if (auth) {
    const token = useAuthStore.getState().accessToken;
    if (token) finalHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, { ...rest, headers: finalHeaders });

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      isJson && payload && typeof payload === "object" && "error" in payload
        ? (payload as { error: { message?: string } }).error?.message ?? response.statusText
        : response.statusText;
    throw new HttpError(message, response.status, payload);
  }

  if (isJson && payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data;
  }

  return payload as T;
}