import { env } from "../config/env";
import { useAuthStore } from "../stores/authStore";

export interface HttpOptions extends RequestInit {
  auth?: boolean;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Internal — prevents infinite refresh loops. */
  _retried?: boolean;
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
  const base = path.startsWith("http")
    ? path
    : `${env.apiUrl}${path.startsWith("/") ? path : `/${path}`}`;
  if (!query) return base;
  const url = new URL(base);
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}

let refreshInFlight: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  const store = useAuthStore.getState();
  const refreshToken = store.refreshToken;
  if (!refreshToken) return false;

  refreshInFlight = (async () => {
    try {
      const response = await fetch(`${env.apiUrl}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ refreshToken }),
        cache: "no-store",
      });

      if (!response.ok) return false;

      const payload = (await response.json()) as {
        data?: { accessToken?: string; refreshToken?: string };
      };

      const access = payload.data?.accessToken;
      const refresh = payload.data?.refreshToken;
      if (!access || !refresh) return false;

      useAuthStore.getState().setTokens(access, refresh);
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

function clearSessionAndRedirect(): void {
  const store = useAuthStore.getState();
  store.clear();

  if (typeof window !== "undefined") {
    const isAuthRoute =
      window.location.pathname.startsWith("/login") ||
      window.location.pathname.startsWith("/register") ||
      window.location.pathname.startsWith("/forgot-password") ||
      window.location.pathname.startsWith("/reset-password");

    if (!isAuthRoute) {
      window.location.replace("/login");
    }
  }
}

export async function http<T = unknown>(
  path: string,
  options: HttpOptions = {},
): Promise<T> {
  const { auth = true, query, headers, _retried, ...rest } = options;
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

  // cache: "no-store" disables HTTP revalidation for API calls. Without
  // it, the browser sends If-None-Match and can serve a stale cached body
  // (e.g. { data: null }) even after the underlying data has changed.
  const response = await fetch(url, {
    ...rest,
    headers: finalHeaders,
    cache: "no-store",
  });

  // On 401 with auth enabled, try a single refresh + retry.
  if (response.status === 401 && auth && !_retried) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return http<T>(path, { ...options, _retried: true });
    }
    clearSessionAndRedirect();
  }

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      isJson && payload && typeof payload === "object" && "error" in payload
        ? (payload as { error: { message?: string } }).error?.message ??
          response.statusText
        : response.statusText;
    throw new HttpError(message, response.status, payload);
  }

  if (isJson && payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data;
  }

  return payload as T;
}