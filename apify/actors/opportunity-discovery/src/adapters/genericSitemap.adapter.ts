import { BaseAdapter } from "./base.adapter.js";
import type { ActorInput, ExtractedOpportunity, RawListingItem } from "../types.js";
import { fetchHtml } from "../utils/fetch.js";
import { absoluteUrl } from "../utils/crawler.js";
import { load } from "cheerio";

export class GenericSitemapAdapter extends BaseAdapter {
  key = "genericSitemap";

  async list(input: ActorInput): Promise<RawListingItem[]> {
    const xml = await fetchHtml(input.sourceUrl);
    const $ = load(xml, { xmlMode: true });
    const items: RawListingItem[] = [];
    $("url > loc, sitemap > loc").each((_i, element) => {
      const loc = $(element).text().trim();
      if (!loc) return;
      items.push({
        url: absoluteUrl(input.sourceUrl, loc),
        title: loc,
        raw: {},
      });
    });
    return items.slice(0, input.maxItems ?? 200);
  }

  async extract(input: ActorInput, item: RawListingItem): Promise<ExtractedOpportunity> {
    const html = await fetchHtml(item.url);
    const $ = load(html);
    return {
      title: this.normalize($("h1").first().text()) ?? item.title ?? "Untitled",
      organization: null,
      country: input.country ?? null,
      location: null,
      category: input.category ?? null,
      publishedAt: null,
      deadline: null,
      description: this.normalize($("main, article, .content").first().text()),
      sourceUrl: item.url,
      sourceName: null,
      sourceId: input.sourceId,
      adapter: this.key,
      referenceNumber: null,
      valueMin: null,
      valueMax: null,
      currency: null,
      eligibility: null,
      requirements: null,
      documents: [],
      raw: {},
    };
  }
}