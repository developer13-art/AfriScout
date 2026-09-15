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
    const html = await fetchHtml(input.sourceUrl);
    const $ = this.listing.load(html);
    const candidates = this.listing.extractListingLinks($, input.sourceUrl);
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
    const html = await fetchHtml(item.url);
    const $ = this.detail.load(html);

    return {
      title: this.normalize(item.title) ?? this.normalize($("h1").first().text()) ?? "Untitled",
      organization: this.normalize($("[data-org], .organization, .org").first().text()),
      country: input.country ?? null,
      location: this.normalize($("[data-location], .location").first().text()),
      category: input.category ?? null,
      publishedAt: this.toIsoOrNull($("time, [data-published]").first().attr("datetime")),
      deadline: this.toIsoOrNull($("time, [data-deadline]").last().attr("datetime")),
      description: this.normalize($("main, article, .content, .description").first().text()),
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
      raw: { listingText: item.raw.listingText ?? null },
    };
  }
}