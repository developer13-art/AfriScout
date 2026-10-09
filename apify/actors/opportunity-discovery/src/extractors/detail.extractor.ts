import { BaseExtractor } from "./base.extractor.js";
import type { CheerioAPI } from "cheerio";
import { absoluteUrl } from "../utils/crawler.js";

export class DetailExtractor extends BaseExtractor {
  private structuredData($: CheerioAPI): Record<string, unknown>[] {
    const records: Record<string, unknown>[] = [];
    const visit = (value: unknown) => {
      if (Array.isArray(value)) {
        value.forEach(visit);
        return;
      }
      if (!value || typeof value !== "object") return;
      const record = value as Record<string, unknown>;
      records.push(record);
      if (record["@graph"]) visit(record["@graph"]);
    };
    $("script[type='application/ld+json']").each((_i, element) => {
      try {
        visit(JSON.parse($(element).text()));
      } catch {
        // Ignore malformed structured metadata and continue with the page markup.
      }
    });
    return records;
  }

  private valueText(value: unknown): string | null {
    if (typeof value === "string") return value.trim() || null;
    if (Array.isArray(value)) return value.map((item) => this.valueText(item)).filter(Boolean).join(", ") || null;
    if (value && typeof value === "object" && "name" in value) {
      return this.valueText((value as Record<string, unknown>).name);
    }
    return null;
  }

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
    const structured = this.structuredData($)
      .map((record) => this.valueText(record.name ?? record.headline))
      .filter((value): value is string => Boolean(value));
    const candidates = [
      $("meta[property='og:title']").attr("content"),
      $("meta[name='twitter:title']").attr("content"),
      ...structured,
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
  extractDescription($: CheerioAPI, maxChars = 10000): string | null {
    // Strip scripts/styles from a cloned tree so their text is not included.
    const cloned = $.root().clone();
    cloned.find("script, style, noscript, svg, iframe").remove();

    const structuredDescription = this.structuredData($)
      .map((record) => this.valueText(record.description))
      .find((value) => value && value.length > 40);
    const metadataDescription = [
      $("meta[property='og:description']").attr("content"),
      $("meta[name='description']").attr("content"),
      $("meta[name='twitter:description']").attr("content"),
      structuredDescription,
    ].map((value) => this.clean(value)).find((value) => value && value.length > 40);
    if (metadataDescription) return this.clip(metadataDescription, maxChars);

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
    const structured = this.structuredData($).flatMap((record) => [
      this.valueText(record.publisher),
      this.valueText(record.provider),
      this.valueText(record.author),
      this.valueText(record.organizer),
    ]);
    const candidates = [
      $("meta[name='author']").attr("content"),
      $("meta[property='og:site_name']").attr("content"),
      ...structured,
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

  extractLocation($: CheerioAPI): string | null {
    const structured = this.structuredData($).flatMap((record) => {
      const location = record.location;
      if (!location || typeof location !== "object") return [];
      const value = location as Record<string, unknown>;
      const address = value.address && typeof value.address === "object"
        ? value.address as Record<string, unknown>
        : {};
      return [
        this.valueText(value.name),
        [
          this.valueText(address.addressLocality),
          this.valueText(address.addressRegion),
          this.valueText(address.addressCountry),
        ].filter(Boolean).join(", "),
      ];
    });
    const candidates = [
      $("[data-location], .location, .venue, [itemprop='address']").first().text(),
      $("meta[name='geo.placename']").attr("content"),
      $("meta[property='og:locality']").attr("content"),
      ...structured,
    ];
    for (const candidate of candidates) {
      const cleaned = this.clean(candidate);
      if (cleaned && cleaned.length <= 240) return cleaned;
    }
    return null;
  }

  extractDate($: CheerioAPI, kind: "published" | "deadline"): string | null {
    const fields = kind === "published"
      ? ["datePosted", "datePublished", "dateCreated", "publishedAt"]
      : ["validThrough", "expirationDate", "applicationDeadline", "deadline", "closingDate"];
    for (const record of this.structuredData($)) {
      for (const field of fields) {
        const value = record[field];
        const text = this.valueText(value);
        if (text && !Number.isNaN(new Date(text).getTime())) return text;
      }
    }
    const selectors = kind === "published"
      ? ["meta[property='article:published_time']", "meta[name='datePublished']", "time[datetime]", "[data-published]"]
      : ["meta[name='applicationDeadline']", "meta[name='deadline']", "time[datetime][data-deadline]", "[data-deadline]"];
    for (const selector of selectors) {
      const node = $(selector).first();
      const value = node.attr("datetime") ?? node.attr("content") ?? node.attr("data-deadline") ?? node.attr("data-published");
      if (value && !Number.isNaN(new Date(value).getTime())) return value;
    }

    const text = $("body").text().replace(/\s+/g, " ");
    const label = kind === "published"
      ? /(?:published|posted|announced)(?:\s+on)?\s*[:\-–]?\s*/i
      : /(?:deadline|closing date|apply by|applications? close(?:s)?|due date)\s*[:\-–]?\s*/i;
    const date = text.match(new RegExp(`${label.source}(\\d{1,2}\\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[, ]+\\d{4})`, "i"));
    return date?.[1] ?? null;
  }

  extractLabeledSection($: CheerioAPI, kind: "eligibility" | "requirements"): string | null {
    const labels = kind === "eligibility"
      ? "eligibility|who can apply|eligible applicants?"
      : "requirements?|what you need";
    const text = $("body").text().replace(/\s+/g, " ");
    const match = text.match(new RegExp(`(?:${labels})\\s*[:\\-–]\\s*(.{12,700}?)(?=(?:eligibility|who can apply|requirements?|application process|how to apply|deadline|closing date)\\s*[:\\-–]|$)`, "i"));
    return match?.[1]?.trim() ?? null;
  }

  extractReferenceNumber($: CheerioAPI): string | null {
    const text = $("body").text().replace(/\s+/g, " ");
    return text.match(/(?:reference|ref\.?|notice|tender)\s*(?:number|no\.?|#|id)?\s*[:#\-]?\s*([A-Z0-9][A-Z0-9/_-]{2,40})/i)?.[1] ?? null;
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