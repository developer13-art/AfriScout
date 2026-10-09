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
    const html = await fetchHtml(input.sourceUrl, {
      waitUntil: input.waitUntil ?? "domcontentloaded",
      waitForSelector: input.waitForSelector,
      waitExtraMs: input.waitExtraMs,
      listingSelector: input.listingSelector,
      interaction: input.interaction,
      timeoutMs: (input.requestTimeoutSeconds ?? 60) * 1000,
    });

    const $ = this.listing.load(html);
    const candidates = this.listing.extractListingLinks($, input.sourceUrl, {
      listingSelector: input.listingSelector,
    });

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
    const html = await fetchHtml(item.url, {
      waitUntil: input.waitUntil ?? "domcontentloaded",
      waitExtraMs: input.waitExtraMs,
      timeoutMs: (input.requestTimeoutSeconds ?? 60) * 1000,
    });
    const $ = this.detail.load(html);
    const title = this.detail.extractTitle($, item.title) ?? "Untitled opportunity";
    const description = this.detail.extractDescription($);
    const location = this.detail.extractLocation($);
    const context = [title, description, location].filter(Boolean).join(" ");
    const country = this.inferCountryCode(context) ?? input.country ?? null;
    const category = this.inferCategory(context) ?? input.category ?? null;

    return {
      title,
      organization: this.detail.extractOrganization($),
      country,
      location: location ?? this.countryName(country),
      category,
      publishedAt: this.toIsoOrNull(
        this.detail.extractDate($, "published") ?? $("time, [data-published]").first().attr("datetime"),
      ),
      deadline: this.toIsoOrNull(
        this.detail.extractDate($, "deadline") ?? $("time, [data-deadline]").last().attr("datetime"),
      ),
      description,
      sourceUrl: item.url,
      sourceName: null,
      sourceId: input.sourceId,
      adapter: input.adapter,
      referenceNumber: this.detail.extractReferenceNumber($),
      valueMin: null,
      valueMax: null,
      currency: null,
      eligibility: this.detail.extractLabeledSection($, "eligibility"),
      requirements: this.detail.extractLabeledSection($, "requirements"),
      documents: this.detail.extractDocumentLinks($, item.url),
      raw: {
        listingText: item.raw?.listingText ?? null,
        detailText: description?.slice(0, 6000) ?? null,
      },
    };
  }

  private inferCountryCode(text: string): string | null {
    const countries: Array<[RegExp, string]> = [
      [/\b(united kingdom|great britain|britain|u\.?k\.?)\b/i, "GB"],
      [/\b(united states|u\.?s\.?a?\.?|america)\b/i, "US"],
      [/\b(canada)\b/i, "CA"],
      [/\b(australia)\b/i, "AU"],
      [/\b(new zealand)\b/i, "NZ"],
      [/\b(nigeria)\b/i, "NG"],
      [/\b(ghana)\b/i, "GH"],
      [/\b(kenya)\b/i, "KE"],
      [/\b(uganda)\b/i, "UG"],
      [/\b(south africa)\b/i, "ZA"],
      [/\b(benin)\b/i, "BJ"],
      [/\b(rwanda)\b/i, "RW"],
      [/\b(tanzania)\b/i, "TZ"],
      [/\b(senegal)\b/i, "SN"],
      [/\b(ethiopia)\b/i, "ET"],
      [/\b(india)\b/i, "IN"],
      [/\b(germany)\b/i, "DE"],
      [/\b(france)\b/i, "FR"],
      [/\b(switzerland)\b/i, "CH"],
      [/\b(japan)\b/i, "JP"],
    ];
    return countries.find(([signal]) => signal.test(text))?.[1] ?? null;
  }

  private countryName(code: string | null): string | null {
    const names: Record<string, string> = {
      GB: "United Kingdom", US: "United States", CA: "Canada", AU: "Australia",
      NZ: "New Zealand", NG: "Nigeria", GH: "Ghana", KE: "Kenya",
      UG: "Uganda", ZA: "South Africa", BJ: "Benin", RW: "Rwanda",
      TZ: "Tanzania", SN: "Senegal", ET: "Ethiopia", IN: "India",
      DE: "Germany", FR: "France", CH: "Switzerland", JP: "Japan",
    };
    return code ? names[code.toUpperCase()] ?? code : null;
  }

  private inferCategory(text: string): string | null {
    const categories: Array<[RegExp, string]> = [
      [/\b(scholarships?|tuition|student funding)\b/i, "SCHOLARSHIPS"],
      [/\b(fellowships?)\b/i, "FELLOWSHIPS"],
      [/\b(internships?)\b/i, "INTERNSHIPS"],
      [/\b(grants?|call for proposals|funding opportunity)\b/i, "GRANTS"],
      [/\b(accelerators?)\b/i, "ACCELERATORS"],
      [/\b(incubators?)\b/i, "INCUBATORS"],
      [/\b(hackathons?|competitions?|challenges?)\b/i, "COMPETITIONS"],
      [/\b(jobs?|vacancies|employment|career opportunity)\b/i, "EMPLOYMENT"],
      [/\b(tenders?|procurement|rfp|rfq|request for proposal|request for quotation)\b/i, "PROCUREMENT"],
      [/\b(contracts?|consultancy)\b/i, "CONTRACTS"],
      [/\b(training|workshop|course)\b/i, "TRAINING"],
      [/\b(research|researcher)\b/i, "RESEARCH"],
    ];
    return categories.find(([signal]) => signal.test(text))?.[1] ?? null;
  }
}