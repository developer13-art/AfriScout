import { Actor } from "apify";
import type { ActorInput } from "../types.js";

let browserPromise: Promise<import("playwright").Browser> | null = null;

async function getBrowser() {
  if (!browserPromise) {
    const { chromium } = await import("playwright");
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
  listingSelector?: string;
  timeoutMs?: number;
  userAgent?: string;
  interaction?: ActorInput["interaction"];
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

    const waitUntil = options.waitUntil ?? "domcontentloaded";

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

    // Run any configured interactions BEFORE waiting for selectors.
    if (options.interaction) {
      const { fill, check, click, waitFor, extraWaitMs } = options.interaction;

      if (fill) {
        for (const { selector, value } of fill) {
          try {
            await page.fill(selector, value, { timeout: 10_000 });
          } catch (error) {
            await Actor.setStatusMessage(
              `interaction fill failed: ${selector}`,
            );
          }
        }
      }

      if (check) {
        for (const { selector } of check) {
          try {
            await page.check(selector, { timeout: 10_000 });
          } catch (error) {
            await Actor.setStatusMessage(
              `interaction check failed: ${selector}`,
            );
          }
        }
      }

      if (click) {
        try {
          await page.click(click, { timeout: 10_000 });
        } catch (error) {
          await Actor.setStatusMessage(`interaction click failed: ${click}`);
        }
      }

      if (waitFor) {
        try {
          await page.waitForSelector(waitFor, { timeout: 20_000 });
        } catch (error) {
          await Actor.setStatusMessage(
            `interaction waitFor timed out: ${waitFor}`,
          );
        }
      }

      if (extraWaitMs && extraWaitMs > 0) {
        await page.waitForTimeout(extraWaitMs);
      }
    }

    // Then the standard waitForSelector from the source metadata.
    if (options.waitForSelector) {
      try {
        await page.waitForSelector(options.waitForSelector, { timeout: timeoutMs });
      } catch {
        await Actor.setStatusMessage(
          `waitForSelector '${options.waitForSelector}' timed out for ${url}`,
        );
      }
    }

    // Then any listingSelector we want to specifically wait for.
    if (options.listingSelector) {
      try {
        await page.waitForSelector(options.listingSelector, { timeout: 20_000 });
      } catch {
        await Actor.setStatusMessage(
          `listingSelector '${options.listingSelector}' timed out for ${url}`,
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