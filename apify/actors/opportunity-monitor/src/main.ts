import { Actor } from "apify";
import { load } from "cheerio";
import type { ActorInput, MonitorResult } from "./types";
import { diffSnapshots } from "./diff/diff.engine";
import { log } from "./utils/logger";

function extractSnapshot(html: string): Record<string, unknown> {
  const $ = load(html);
  return {
    title: $("h1").first().text().trim() || null,
    deadline: $("time").last().attr("datetime") ?? null,
    requirements: $("[data-requirements]").first().text().trim() || null,
    eligibility: $("[data-eligibility]").first().text().trim() || null,
    description: $("main, article").first().text().replace(/\s+/g, " ").trim() || null,
    referenceNumber: $("[data-reference]").first().text().trim() || null,
  };
}

async function run(): Promise<void> {
  await Actor.init();

  const input = (await Actor.getInput<ActorInput>()) as ActorInput | null;
  if (!input?.sourceUrl) throw new Error("sourceUrl is required");

  const response = await fetch(input.sourceUrl);
  if (!response.ok) {
    log.warn("monitor_fetch_failed", { status: response.status, url: input.sourceUrl });
    await Actor.exit({ exitCode: 1 });
    return;
  }

  const html = await response.text();
  const current = extractSnapshot(html);

  if (!input.previousSnapshot) {
    const result: MonitorResult = {
      opportunityId: input.opportunityId,
      changed: false,
    };
    await Actor.pushData(result);
    await Actor.exit();
    return;
  }

  const diff = diffSnapshots({
    previous: input.previousSnapshot,
    current,
  });

  const result: MonitorResult = diff.changed
    ? {
        opportunityId: input.opportunityId,
        changed: true,
        field: diff.field,
        oldValue: diff.oldValue,
        newValue: diff.newValue,
      }
    : { opportunityId: input.opportunityId, changed: false };

  await Actor.pushData(result);
  log.info("monitor_completed", result);
  await Actor.exit();
}

run().catch(async (error) => {
  log.error("monitor_failed", {
    message: error instanceof Error ? error.message : String(error),
  });
  await Actor.exit({ exitCode: 1 });
});