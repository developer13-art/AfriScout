import { Actor } from "apify";
import { selectAdapter } from "./adapters/registry.js";
import type { ActorInput, ExtractedOpportunity } from "./types.js";
import { validateExtracted } from "./validators/opportunity.validator.js";
import { log } from "./utils/logger.js";
import { randomDelay } from "./utils/delay.js";
import { closeBrowser } from "./utils/fetch.js";

async function run(): Promise<void> {
  await Actor.init();

  const input = (await Actor.getInput<ActorInput>()) as ActorInput | null;
  if (!input) throw new Error("Actor input is required");
  if (!input.sourceId || !input.sourceUrl || !input.adapter) {
    throw new Error("sourceId, sourceUrl, and adapter are required");
  }

  log.info("discovery_started", {
    sourceId: input.sourceId,
    sourceUrl: input.sourceUrl,
    adapter: input.adapter,
    waitUntil: input.waitUntil ?? "networkidle",
  });

  const adapter = selectAdapter(input);
  const listing = await adapter.list(input);
  log.info("listing_extracted", { count: listing.length });

  const limit = input.maxItems ?? listing.length;
  const processed: ExtractedOpportunity[] = [];

  for (const item of listing.slice(0, limit)) {
    try {
      const extracted = await adapter.extract(input, item);
      const issues = validateExtracted(extracted);
      if (issues.length > 0) {
        log.warn("item_validation_failed", { url: item.url, issues });
        continue;
      }
      await Actor.pushData(extracted);
      processed.push(extracted);
      await randomDelay(200, 700);
    } catch (error) {
      log.error("item_extraction_failed", {
        url: item.url,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  log.info("discovery_completed", { pushed: processed.length });
  await closeBrowser();
  await Actor.exit();
}

run().catch(async (error) => {
  log.error("discovery_failed", {
    message: error instanceof Error ? error.message : String(error),
  });
  try {
    await closeBrowser();
  } catch {
    // ignore
  }
  await Actor.exit({ exitCode: 1 });
});