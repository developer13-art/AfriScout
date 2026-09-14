import { BaseAdapter } from "./base.adapter";
import type { ActorInput, ExtractedOpportunity, RawListingItem } from "../types";
import { ListingExtractor } from "../extractors/listing.extractor";
import { DetailExtractor } from "../extractors/detail.extractor";
import { fetchHtml } from "../utils/fetch";
import { absoluteUrl } from "../utils/crawler";

export class GovernmentAdapter extends BaseAdapter {
  key = "government";
  private listing = new ListingExtractor();
  private detail = new DetailExtractor();

  async list(input: ActorInput): Promise<RawListingItem[]> {
    const html = await fetchHtml(input.sourceUrl);
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
    const html = await fetchHtml(item.url);
    const $ = this.detail.load(html);

    return {
      title: this.normalize(item.title) ?? this.normalize($("h1").first().text()) ?? "Untitled",
      organization: this.normalize($("[data-org], .organization, .agency").first().text()),
      country: input.country ?? null,
      location: this.normalize($("[data-location], .location").first().text()),
      category: input.category ?? null,
      publishedAt: this.toIsoOrNull($("[data-published], .published, time").first().attr("datetime")),
      deadline: this.toIsoOrNull($("[data-deadline], .deadline, time").last().attr("datetime")),
      description: this.normalize($("main, article, .content").first().text()),
      sourceUrl: item.url,
      sourceName: null,
      sourceId: input.sourceId,
      adapter: this.key,
      referenceNumber: this.normalize($("[data-reference], .reference").first().text()),
      valueMin: null,
      valueMax: null,
      currency: null,
      eligibility: this.normalize($("[data-eligibility], .eligibility").first().text()),
      requirements: this.normalize($("[data-requirements], .requirements").first().text()),
      documents: this.detail.extractDocumentLinks($, item.url),
      raw: { listingText: item.raw.listingText ?? null },
    };
  }
}