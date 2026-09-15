import { BaseAdapter } from "./base.adapter.js";
import type { ActorInput, ExtractedOpportunity, RawListingItem } from "../types.js";
import { ListingExtractor } from "../extractors/listing.extractor.js";
import { DetailExtractor } from "../extractors/detail.extractor.js";
import { fetchHtml } from "../utils/fetch.js";
import { absoluteUrl } from "../utils/crawler.js";

export class GovernmentAdapter extends BaseAdapter {
  key = "government";
  private listing = new ListingExtractor();
  private detail = new DetailExtractor();

  async list(input: ActorInput): Promise<RawListingItem[]> {
    const html = await fetchHtml(input.sourceUrl, {
      waitUntil: input.waitUntil ?? "networkidle",
      waitForSelector: input.waitForSelector,
      waitExtraMs: input.waitExtraMs,
      timeoutMs: (input.requestTimeoutSeconds ?? 60) * 1000,
    });

    const $ = this.listing.load(html);
    const candidates = this.listing.extractListingLinks($, input.sourceUrl);
    const limited = candidates.slice(0, input.maxItems ?? 200);

    return limited.map((entry) => ({
      url: absoluteUrl(input.sourceUrl, entry.href),
      title: entry.title,
      raw: { listingText: entry.text },
    }));
  }

  async extract(
    input: ActorInput,
    item: RawListingItem,
  ): Promise<ExtractedOpportunity> {
    const html = await fetchHtml(item.url, {
      waitUntil: input.waitUntil ?? "networkidle",
      waitExtraMs: input.waitExtraMs,
      timeoutMs: (input.requestTimeoutSeconds ?? 60) * 1000,
    });
    const $ = this.detail.load(html);

    const title =
      this.detail.extractTitle($, item.title) ?? "Untitled opportunity";
    const organization = this.detail.extractOrganization($);
    const description = this.detail.extractDescription($);

    return {
      title,
      organization,
      country: input.country ?? null,
      location: this.normalize($("[data-location], .location").first().text()),
      category: input.category ?? null,
      publishedAt: this.toIsoOrNull(
        $("time, [data-published]").first().attr("datetime"),
      ),
      deadline: this.toIsoOrNull(
        $("time, [data-deadline]").last().attr("datetime"),
      ),
      description,
      sourceUrl: item.url,
      sourceName: null,
      sourceId: input.sourceId,
      adapter: this.key,
      referenceNumber: this.normalize(
        $("[data-reference], .reference").first().text(),
      ),
      valueMin: null,
      valueMax: null,
      currency: null,
      eligibility: this.normalize(
        $("[data-eligibility], .eligibility").first().text(),
      ),
      requirements: this.normalize(
        $("[data-requirements], .requirements").first().text(),
      ),
      documents: this.detail.extractDocumentLinks($, item.url),
      raw: { listingText: item.raw.listingText ?? null },
    };
  }
}