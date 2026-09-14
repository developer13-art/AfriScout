import { apifyConfig } from "../../config/apify";
import { logger } from "../../config/logger";
import { InternalError } from "../../utils/errors";
import { sleep } from "../../utils/sleep";

const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;

export interface ApifyRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  timeoutMs?: number;
}

export interface ApifyResponse<T> {
  data: T;
}

export function assertApifyConfigured(): void {
  if (!apifyConfig.isConfigured) {
    throw new InternalError(
      "Apify is not configured. Set APIFY_TOKEN in the environment.",
    );
  }
}

export async function apifyRequest<T>(
  path: string,
  options: ApifyRequestOptions = {},
): Promise<T> {
  assertApifyConfigured();

  const { method = "GET", query, body, timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS } = options;

  const url = new URL(`${apifyConfig.baseUrl}${path.startsWith("/") ? path : `/${path}`}`);
  url.searchParams.set("token", apifyConfig.token);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) continue;
      url.searchParams.set(key, String(value));
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url.toString(), {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const text = await response.text();
    const json = text ? JSON.parse(text) : {};

    if (!response.ok) {
      logger.error(
        { status: response.status, path, body: json },
        "apify_request_failed",
      );
      throw new InternalError(
        `Apify request failed with status ${response.status}`,
        json,
      );
    }

    return json as T;
  } catch (error) {
    if (error instanceof InternalError) throw error;
    logger.error({ err: error, path }, "apify_request_error");
    throw new InternalError("Apify request failed", { path });
  } finally {
    clearTimeout(timer);
  }
}

export async function apifyRequestWithRetry<T>(
  path: string,
  options: ApifyRequestOptions & { attempts?: number; backoffMs?: number } = {},
): Promise<T> {
  const attempts = options.attempts ?? 3;
  const backoffMs = options.backoffMs ?? 1000;
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await apifyRequest<T>(path, options);
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await sleep(backoffMs * 2 ** (attempt - 1));
    }
  }
  throw lastError;
}