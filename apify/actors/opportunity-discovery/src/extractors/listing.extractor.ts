import { BaseExtractor } from "./base.extractor";
import type { CheerioAPI } from "cheerio";
import { absoluteUrl } from "../utils/crawler";

export interface ListingLink {
  href: string;
  title: string;
  text: string;
}

export class ListingExtractor extends BaseExtractor {
  extractListingLinks($: CheerioAPI, baseUrl: string): ListingLink[] {
    const results: ListingLink[] = [];
    const seen = new Set<string>();

    $("a[href]").each((_i, element) => {
      const href = $(element).attr("href");
      if (!href) return;
      const absolute = absoluteUrl(baseUrl, href);
      if (seen.has(absolute)) return;
      const text = $(element).text().replace(/\s+/g, " ").trim();
      if (text.length < 5) return;
      seen.add(absolute);
      results.push({ href: absolute, title: text, text });
    });

    return results;
  }
}