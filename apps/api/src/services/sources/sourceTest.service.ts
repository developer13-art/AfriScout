import { prisma } from "../../config/database";
import { apifyActors, startActorRun } from "../apify/actor.service";
import { fetchDatasetItems } from "../apify/dataset.service";
import { NotFoundError } from "../../utils/errors";
import { logger } from "../../config/logger";
import { apifyConfig } from "../../config/apify";

export interface SourceTestResult {
  success: boolean;
  itemsFound: number;
  datasetId: string | null;
  runId: string | null;
  errorMessage: string | null;
}

interface SourceMetadata {
  waitUntil?: "load" | "domcontentloaded" | "networkidle" | "commit";
  waitForSelector?: string;
  waitExtraMs?: number;
}

export async function testSource(sourceId: string): Promise<SourceTestResult> {
  const source = await prisma.source.findUnique({ where: { id: sourceId } });
  if (!source) throw new NotFoundError("Source not found");

  if (!apifyConfig.isConfigured || !apifyActors.opportunityDiscovery) {
    logger.warn({ sourceId }, "source_test_skipped_apify_not_configured");
    return {
      success: false,
      itemsFound: 0,
      datasetId: null,
      runId: null,
      errorMessage: "Apify is not configured or actor ID is missing",
    };
  }

  const metadata = (source.metadata as SourceMetadata | null) ?? {};

  try {
    const run = await startActorRun(apifyActors.opportunityDiscovery, {
      sourceId: source.id,
      sourceUrl: source.url,
      sourceType: source.sourceType,
      country: source.countryCode ?? undefined,
      category: source.category ?? undefined,
      adapter: source.adapter,
      maxItems: 5,
      waitUntil: metadata.waitUntil,
      waitForSelector: metadata.waitForSelector,
      waitExtraMs: metadata.waitExtraMs,
    });

    // Wait for the Actor to produce items. Playwright boots Chromium and
    // renders the page, so we give it up to 90 seconds.
    const waitMs = 90_000;
    const startedAt = Date.now();
    let items: unknown[] = [];

    while (Date.now() - startedAt < waitMs) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      if (!run.defaultDatasetId) break;
      items = await fetchDatasetItems(run.defaultDatasetId, { limit: 5 });
      if (items.length > 0) break;
    }

    return {
      success: true,
      itemsFound: items.length,
      datasetId: run.defaultDatasetId,
      runId: run.id,
      errorMessage: null,
    };
  } catch (error) {
    logger.error({ err: error, sourceId }, "source_test_failed");
    return {
      success: false,
      itemsFound: 0,
      datasetId: null,
      runId: null,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    };
  }
}