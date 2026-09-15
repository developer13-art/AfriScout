import { Actor } from "apify";

/**
 * Fetch HTML using Playwright. Boots a shared Chromium browser the first
 * time it is called, reuses it across pages, and closes it on Actor exit.
 *
 * Uses the browser binary that Apify's base image provides via the
 * APIFY_DEFAULT_BROWSER_PATH environment variable. Without this, Playwright
 * 1.49+ looks for a separate chromium_headless_shell binary, which the
 * apify/actor-node-playwright-chrome image does not ship.
 */

let browserPromise: Promise<import("playwright").Browser> | null = null;

async function getBrowser() {
  if (!browserPromise) {
    const { chromium } = await import("playwright");

    // Apify base images expose the bundled Chromium binary path here.
    // Passing it as executablePath short-circuits Playwright's browser
    // resolution logic, so we always use the correct binary.
    const executablePath = process.env.APIFY_DEFAULT_BROWSER_PATH;

    browserPromise = chromium.launch({
      headless: true,
      executablePath: executablePath || undefined,
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    });
  }
  return browserPromise;
}

export interface FetchOptions {
  waitUntil?: "load" | "domcontentloaded" | "networkidle" | "commit";
  waitForSelector?: string;
  waitExtraMs?: number;
  timeoutMs?: number;
  userAgent?: string;
}

export async function fetchHtml(
  url: string,
  options: FetchOptions = {},
): Promise<string> {
  const timeoutMs = options.timeoutMs ?? 60_000;

  try {
    const browser = await getBrowser();
    const context = await browser.newContext({
      userAgent:
        options.userAgent ??
        "Mozilla/5.0 (compatible; AfriScout/1.0; +https://afriscout.example)",
      viewport: { width: 1366, height: 900 },
      ignoreHTTPSErrors: true,
    });

    const page = await context.newPage();
    page.setDefaultNavigationTimeout(timeoutMs);

    const waitUntil = options.waitUntil ?? "networkidle";

    try {
      await page.goto(url, { waitUntil, timeout: timeoutMs });
    } catch (gotoError) {
      if (waitUntil === "networkidle") {
        await Actor.setStatusMessage(
          `networkidle timed out for ${url}, retrying with domcontentloaded`,
        );
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: timeoutMs });
      } else {
        throw gotoError;
      }
    }

    if (options.waitForSelector) {
      try {
        await page.waitForSelector(options.waitForSelector, { timeout: timeoutMs });
      } catch {
        await Actor.setStatusMessage(
          `waitForSelector '${options.waitForSelector}' timed out for ${url}`,
        );
      }
    }

    if (options.waitExtraMs && options.waitExtraMs > 0) {
      await page.waitForTimeout(options.waitExtraMs);
    }

    const html = await page.content();
    await context.close();
    return html;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await Actor.setStatusMessage(`Fetch failed: ${message} ${url}`);
    throw new Error(`Fetch failed for ${url}: ${message}`);
  }
}

export async function closeBrowser(): Promise<void> {
  if (!browserPromise) return;
  try {
    const browser = await browserPromise;
    await browser.close();
  } catch {
    // ignore
  } finally {
    browserPromise = null;
  }
}