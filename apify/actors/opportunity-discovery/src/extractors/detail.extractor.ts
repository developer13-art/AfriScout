import { BaseExtractor } from "./base.extractor.js";
import type { CheerioAPI } from "cheerio";
import { absoluteUrl } from "../utils/crawler.js";

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

  // Extract the most likely title from a detail page.
  extractTitle($: CheerioAPI, fallback?: string | null): string | null {
    const candidates = [
      $("meta[property='og:title']").attr("content"),
      $("meta[name='twitter:title']").attr("content"),
      $("h1").first().text(),
      $("h2").first().text(),
      $("title").first().text(),
    ];

    for (const candidate of candidates) {
      const cleaned = this.clean(candidate);
      if (cleaned && cleaned.length >= 4) return cleaned;
    }

    const cleanedFallback = this.clean(fallback);
    return cleanedFallback;
  }

  // Extract a short, human-readable description. Prefer paragraph text.
  // Never returns scripts, styles, or the whole page.
  extractDescription($: CheerioAPI, maxChars = 2000): string | null {
    // Strip scripts/styles from a cloned tree so their text is not included.
    const cloned = $.root().clone();
    cloned.find("script, style, noscript, svg, iframe").remove();

    const containerSelectors = [
      "article",
      "main",
      "[role='main']",
      ".notice-detail",
      ".notice-details",
      ".notice-content",
      ".tender-detail",
      ".opportunity-detail",
      ".description",
      ".summary",
      ".content",
    ];

    for (const selector of containerSelectors) {
      const node = cloned.find(selector).first();
      if (node.length === 0) continue;

      const paragraphs = node.find("p").map((_i, el) => cloned.find(el).text().trim()).get();
      const joined = paragraphs
        .filter((p) => p.length > 20)
        .join("\n\n")
        .trim();

      if (joined.length > 60) return this.clip(joined, maxChars);

      const text = node.text().trim();
      if (text.length > 60) return this.clip(text, maxChars);
    }

    // Last resort: the body, script-free.
    const bodyText = cloned.find("body").text().trim();
    if (bodyText.length > 60) return this.clip(bodyText, maxChars);

    return null;
  }

  // Extract the publishing organization from common markup and meta tags.
  extractOrganization($: CheerioAPI): string | null {
    const candidates = [
      $("meta[name='author']").attr("content"),
      $("meta[property='og:site_name']").attr("content"),
      $("[data-org]").first().text(),
      $(".organization").first().text(),
      $(".agency").first().text(),
      $(".issuer").first().text(),
    ];

    for (const candidate of candidates) {
      const cleaned = this.clean(candidate);
      if (cleaned && cleaned.length >= 3 && cleaned.length <= 200) return cleaned;
    }

    return null;
  }

  private clean(value: string | undefined | null): string | null {
    if (!value) return null;
    const cleaned = String(value).replace(/\s+/g, " ").trim();
    if (cleaned.length === 0) return null;
    return cleaned;
  }

  private clip(value: string, maxChars: number): string {
    const cleaned = value.replace(/\s+/g, " ").trim();
    if (cleaned.length <= maxChars) return cleaned;
    return cleaned.slice(0, maxChars - 3).trimEnd() + "...";
  }
}