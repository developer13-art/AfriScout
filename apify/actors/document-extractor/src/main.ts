import { Actor } from "apify";
import type { ActorInput } from "./types";
import { fetchBuffer } from "./fetchers/fetch";
import { parsePdf, parseDocx, parseHtmlDocument } from "./parsers";
import {
  extractEligibility,
  extractRequirements,
  extractDocuments,
  extractValue,
  extractDeadline,
} from "./extractors";
import { log } from "./utils/logger";

async function run(): Promise<void> {
  await Actor.init();

  const input = (await Actor.getInput<ActorInput>()) as ActorInput | null;
  if (!input?.documentUrl) throw new Error("documentUrl is required");

  const { buffer, mimeType } = await fetchBuffer(input.documentUrl);
  const effectiveMime = input.mimeType ?? mimeType ?? "";
  log.info("document_fetched", {
    documentUrl: input.documentUrl,
    mimeType: effectiveMime,
    size: buffer.byteLength,
  });

  let text = "";
  if (effectiveMime.includes("pdf")) {
    text = await parsePdf(buffer);
  } else if (effectiveMime.includes("word") || effectiveMime.includes("docx")) {
    text = await parseDocx(buffer);
  } else {
    text = parseHtmlDocument(buffer.toString("utf8"));
  }

  const result = {
    eligibility: extractEligibility(text),
    requirements: extractRequirements(text),
    documents: extractDocuments(text),
    value: extractValue(text),
    deadline: extractDeadline(text),
    notes: "",
  };

  await Actor.pushData(result);
  log.info("document_extraction_completed", result);
  await Actor.exit();
}

run().catch(async (error) => {
  log.error("document_extraction_failed", {
    message: error instanceof Error ? error.message : String(error),
  });
  await Actor.exit({ exitCode: 1 });
});