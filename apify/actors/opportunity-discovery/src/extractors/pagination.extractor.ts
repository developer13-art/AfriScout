import { BaseExtractor } from "./base.extractor.js";
import type { CheerioAPI } from "cheerio";
import { absoluteUrl } from "../utils/crawler.js";

export class PaginationExtractor extends BaseExtractor {
  nextPageUrl($: CheerioAPI, baseUrl: string): string | null {
    const candidates = [
      "a[rel=next]",
      "a.next",
      "a.pagination-next",
      "[aria-label='Next page']",
    ];
    for (const selector of candidates) {
      const href = $(selector).first().attr("href");
      if (href) return absoluteUrl(baseUrl, href);
    }
    return null;
  }
}