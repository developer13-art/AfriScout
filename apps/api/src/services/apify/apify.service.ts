import { env } from "../../config/env";
import { apifyConfig } from "../../config/apify";
import { logger } from "../../config/logger";
import { InternalError } from "../../utils/errors";
import { sleep } from "../../utils/sleep";

const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;
const MAX_TIMEOUT_MS = 2_147_483_647; // Node's setTimeout max (2^31 - 1)

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
  if (!apifyConfig.actors.opportunityDiscovery) {
    throw new InternalError(
      "Apify is not configured. Set the opportunity discovery actor ID.",
    );
  }
  if (!env.APIFY_TOKEN) {
    throw new InternalError("Apify is not configured. Add APIFY_TOKEN to Replit Secrets.");
  }
}

export async function apifyRequest<T>(
  path: string,
  options: ApifyRequestOptions = {},
): Promise<T> {
  const { method = "GET", query, body, timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS } = options;

  assertApifyConfigured();
  const apiPath = path.startsWith("/v2/")
    ? path
    : `/v2${path.startsWith("/") ? path : `/${path}`}`;
  const url = new URL(apiPath, env.APIFY_BASE_URL);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) continue;
      url.searchParams.set(key, String(value));
    }
  }

  const effectiveTimeout = Math.min(timeoutMs, MAX_TIMEOUT_MS);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), effectiveTimeout);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${env.APIFY_TOKEN}`,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await response.text();
    let json: unknown = {};
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        json = text;
      }
    }

    if (!response.ok) {
      logger.error(
        { status: response.status, path, body: json },
        "apify_request_failed",
      );
      throw new InternalError(
        `Apify request failed with status ${response.status}`,
        json as Record<string, unknown>,
      );
    }

    return json as T;
  } catch (error) {
    if (error instanceof InternalError) throw error;
    if (controller.signal.aborted) {
      throw new InternalError(`Apify request timed out after ${effectiveTimeout}ms`);
    }
    logger.error({ err: error, path }, "apify_request_error");
    throw new InternalError("Apify request failed", {
      path,
      reason: error instanceof Error ? error.message : "unknown error",
    });
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