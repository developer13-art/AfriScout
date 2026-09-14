import { BaseExtractor } from "./base.extractor";
import type { CheerioAPI } from "cheerio";
import { absoluteUrl } from "../utils/crawler";

export class DetailExtractor extends BaseExtractor {
  extractDocumentLinks($: CheerioAPI, baseUrl: string): string[] {
    const links: string[] = [];
    const seen = new Set<string>();
    $("a[href]").each((_i, element) => {
      const href = $(element).attr("href");
      if (!href) return;
      if (!/\.(pdf|doc|docx|html?)$/i.test(href)) return;
      const absolute = absoluteUrl(baseUrl, href);
      if (seen.has(absolute)) return;
      seen.add(absolute);
      links.push(absolute);
    });
    return links;
  }
}