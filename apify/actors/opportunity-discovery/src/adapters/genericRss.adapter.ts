import { BaseAdapter } from "./base.adapter.js";
import type { ActorInput, ExtractedOpportunity, RawListingItem } from "../types.js";
import { fetchHtml } from "../utils/fetch.js";
import { absoluteUrl } from "../utils/crawler.js";
import { load } from "cheerio";

export class GenericRssAdapter extends BaseAdapter {
  key = "genericRss";

  async list(input: ActorInput): Promise<RawListingItem[]> {
    const xml = await fetchHtml(input.sourceUrl);
    const $ = load(xml, { xmlMode: true });
    const items: RawListingItem[] = [];
    $("item, entry").each((_i, element) => {
      const link = $(element).find("link").text().trim() || $(element).find("link").attr("href") || "";
      const title = $(element).find("title").text().trim();
      const description = $(element).find("description, summary").text().trim();
      if (!link) return;
      items.push({
        url: absoluteUrl(input.sourceUrl, link),
        title,
        raw: { description },
      });
    });
    return items.slice(0, input.maxItems ?? 200);
  }

  async extract(input: ActorInput, item: RawListingItem): Promise<ExtractedOpportunity> {
    const html = await fetchHtml(item.url);
    const $ = load(html);
    return {
      title: this.normalize(item.title) ?? this.normalize($("h1").first().text()) ?? "Untitled",
      organization: null,
      country: input.country ?? null,
      location: null,
      category: input.category ?? null,
      publishedAt: null,
      deadline: null,
      description: this.normalize($("main, article, .content").first().text()) ??
        this.normalize(item.raw.description as string | undefined),
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