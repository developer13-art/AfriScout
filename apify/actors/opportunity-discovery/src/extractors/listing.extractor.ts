import { BaseExtractor } from "./base.extractor.js";
import type { CheerioAPI } from "cheerio";
import { absoluteUrl } from "../utils/crawler.js";

export interface ListingLink {
  href: string;
  title: string;
  text: string;
}

// Anchor text signals that suggest the link points at an opportunity.
const OPPORTUNITY_KEYWORDS = [
  "tender",
  "tenders",
  "contract",
  "contracts",
  "grant",
  "grants",
  "scholarship",
  "scholarships",
  "fellowship",
  "fellowships",
  "rfp",
  "rfq",
  "procurement",
  "opportunity",
  "opportunities",
  "apply",
  "call for",
  "bid",
  "bids",
  "job",
  "jobs",
  "vacancy",
  "vacancies",
  "internship",
  "internships",
  "submit",
  "view details",
  "view notice",
  "view tender",
  "learn more",
];

// URL path segments that suggest an opportunity detail page.
const OPPORTUNITY_URL_SEGMENTS = [
  "/tender/",
  "/tenders/",
  "/notice/",
  "/notices/",
  "/opportunity/",
  "/opportunities/",
  "/grant/",
  "/grants/",
  "/scholarship/",
  "/scholarships/",
  "/job/",
  "/jobs/",
  "/vacancy/",
  "/vacancies/",
  "/rfp/",
  "/rfq/",
  "/contract/",
  "/contracts/",
  "/bid/",
  "/bids/",
  "/apply/",
  "/programme/",
  "/program/",
];

// Anchor texts that clearly mean "not an opportunity".
const REJECT_TEXT = new Set([
  "log in",
  "login",
  "sign in",
  "signin",
  "register",
  "sign up",
  "signup",
  "create account",
  "create an account",
  "forgot password",
  "reset password",
  "home",
  "about",
  "about us",
  "contact",
  "contact us",
  "privacy",
  "privacy policy",
  "terms",
  "terms of use",
  "terms of service",
  "help",
  "faq",
  "support",
  "menu",
  "search",
  "back",
  "next",
  "previous",
  "jump to the main content",
  "jump into the main content",
  "skip to main content",
  "skip to content",
  "main content",
  "main menu",
  "read more",
  "more",
  "learn more",
]);

export class ListingExtractor extends BaseExtractor {
  extractListingLinks($: CheerioAPI, baseUrl: string): ListingLink[] {
    const results: ListingLink[] = [];
    const seen = new Set<string>();

    $("a[href]").each((_i, element) => {
      const href = $(element).attr("href");
      if (!href) return;

      // Reject non-navigational or fragment URLs
      if (
        href.startsWith("#") ||
        href.startsWith("javascript:") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      ) {
        return;
      }

      const absolute = absoluteUrl(baseUrl, href);
      if (seen.has(absolute)) return;

      const rawText = $(element).text().replace(/\s+/g, " ").trim();
      const lowerText = rawText.toLowerCase();

      // Reject empty or trivially short anchor text
      if (rawText.length < 6 || rawText.length > 300) return;

      // Reject known navigation strings
      if (REJECT_TEXT.has(lowerText)) return;

      // Reject links whose text looks like a whole sentence of boilerplate
      if (lowerText.startsWith("jump to") || lowerText.startsWith("skip to")) return;

      // Score the link
      const textMatch = OPPORTUNITY_KEYWORDS.some((kw) => lowerText.includes(kw));
      const pathMatch = OPPORTUNITY_URL_SEGMENTS.some((seg) =>
        absolute.toLowerCase().includes(seg),
      );

      // At least one signal must be present
      if (!textMatch && !pathMatch) return;

      seen.add(absolute);
      results.push({ href: absolute, title: rawText, text: rawText });
    });

    return results;
  }
}