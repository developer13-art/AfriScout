import { BaseAdapter } from "./base.adapter.js";
import type { ActorInput, ExtractedOpportunity, RawListingItem } from "../types.js";
import { ListingExtractor } from "../extractors/listing.extractor.js";
import { DetailExtractor } from "../extractors/detail.extractor.js";
import { fetchHtml } from "../utils/fetch.js";
import { absoluteUrl } from "../utils/crawler.js";

export class GenericListingAdapter extends BaseAdapter {
  key = "genericListing";
  protected listing = new ListingExtractor();
  protected detail = new DetailExtractor();

  async list(input: ActorInput): Promise<RawListingItem[]> {
    const html = await fetchHtml(input.sourceUrl, {
      waitUntil: input.waitUntil ?? "domcontentloaded",
      waitForSelector: input.waitForSelector,
      waitExtraMs: input.waitExtraMs,
      listingSelector: input.listingSelector,
      interaction: input.interaction,
      timeoutMs: (input.requestTimeoutSeconds ?? 60) * 1000,
    });

    const $ = this.listing.load(html);
    const candidates = this.listing.extractListingLinks($, input.sourceUrl, {
      listingSelector: input.listingSelector,
    });

    return candidates.slice(0, input.maxItems ?? 200).map((entry) => ({
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
      waitUntil: input.waitUntil ?? "domcontentloaded",
      waitExtraMs: input.waitExtraMs,
      timeoutMs: (input.requestTimeoutSeconds ?? 60) * 1000,
    });
    const $ = this.detail.load(html);

    return {
      title:
        this.detail.extractTitle($, item.title) ?? "Untitled opportunity",
      organization: this.detail.extractOrganization($),
      country: input.country ?? null,
      location: this.normalize($("[data-location], .location").first().text()),
      category: input.category ?? null,
      publishedAt: this.toIsoOrNull(
        $("time, [data-published]").first().attr("datetime"),
      ),
      deadline: this.toIsoOrNull(
        $("time, [data-deadline]").last().attr("datetime"),
      ),
      description: this.detail.extractDescription($),
      sourceUrl: item.url,
      sourceName: null,
      sourceId: input.sourceId,
      adapter: input.adapter,
      referenceNumber: null,
      valueMin: null,
      valueMax: null,
      currency: null,
      eligibility: null,
      requirements: null,
      documents: this.detail.extractDocumentLinks($, item.url),
      raw: { listingText: item.raw?.listingText ?? null },
    };
  }
}