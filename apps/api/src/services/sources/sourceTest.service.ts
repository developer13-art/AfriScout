import { prisma } from "../../config/database";
import { apifyActors } from "../apify/actor.service";
import { startActorRun } from "../apify/actor.service";
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

export async function testSource(sourceId: string): Promise<SourceTestResult> {
  const source = await prisma.source.findUnique({ where: { id: sourceId } });
  if (!source) throw new NotFoundError("Source not found");

  if (!apifyConfig.isConfigured || !apifyActors.opportunityDiscovery) {
    logger.warn(
      { sourceId },
      "source_test_skipped_apify_not_configured",
    );
    return {
      success: false,
      itemsFound: 0,
      datasetId: null,
      runId: null,
      errorMessage: "Apify is not configured or actor ID is missing",
    };
  }

  try {
    const run = await startActorRun(apifyActors.opportunityDiscovery, {
      sourceId: source.id,
      sourceUrl: source.url,
      sourceType: source.sourceType,
      country: source.countryCode ?? undefined,
      category: source.category ?? undefined,
      adapter: source.adapter,
      maxItems: 5,
    });

    // Small dataset check, without waiting for completion for too long.
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const items = run.defaultDatasetId
      ? await fetchDatasetItems(run.defaultDatasetId, { limit: 5 })
      : [];

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