import type { ApifyActorOutputItem } from "../../types/apify";
import type { NormalizedOpportunity } from "../../types/opportunity";
import { toIsoOrNull } from "../../utils/date";
import { normalizeCurrencyCode } from "../../utils/currency";
import { normalizeWhitespace, stripHtml, truncate } from "../../utils/string";
import { normalizeUrl } from "../../utils/url";

export function normalizeOpportunity(
  raw: ApifyActorOutputItem,
): NormalizedOpportunity {
  const listingText = typeof raw.raw?.listingText === "string" ? raw.raw.listingText : "";
  const text = [raw.title, raw.description, raw.location, listingText].filter(Boolean).join(" ");
  const category = inferCategory(text) ?? raw.category;
  const inferredCountryCode = inferCountryCode(text);
  const countryCode = inferredCountryCode ?? raw.country;
  const deadline = raw.deadline ?? inferDeadline(text);
  const organizationName = raw.organization ?? inferOrganization(raw.title, listingText);
  const description = (raw.description ?? listingText) || null;
  const requirements = raw.requirements ?? inferLabeledText(text, /\b(?:requirements?|what you need)\b\s*[:\-–]\s*/i);
  const eligibility = raw.eligibility ?? inferLabeledText(text, /\b(?:eligibility|who can apply|eligible applicants?)\b\s*[:\-–]\s*/i);

  return {
    title: normalizeWhitespace(stripHtml(raw.title ?? "")) || "Untitled opportunity",
    organizationName: organizationName ? normalizeWhitespace(organizationName) : null,
    organizationId: null,
    category: mapCategory(category),
    subcategory: null,
    opportunityType: mapOpportunityType(category),
    countryCode: countryCode ? normalizeCountryCode(countryCode) : null,
    region: null,
    city: raw.location ? normalizeWhitespace(raw.location) : null,
    locationText: raw.location
      ? normalizeWhitespace(raw.location)
      : inferredCountryCode
        ? countryName(inferredCountryCode)
        : null,
    isRemote: /\b(remote|work from anywhere|anywhere in the world)\b/i.test(text),
    description: description ? truncate(stripHtml(description), 20000) : null,
    summaryShort: description ? truncate(stripHtml(description), 220) : null,
    valueMin: raw.valueMin ?? null,
    valueMax: raw.valueMax ?? null,
    currency: normalizeCurrencyCode(raw.currency ?? null),
    publishedAt: toIsoOrNull(raw.publishedAt),
    deadline: toIsoOrNull(deadline),
    eligibility: eligibility ? normalizeWhitespace(stripHtml(eligibility)) : null,
    requirements: requirements ? normalizeWhitespace(stripHtml(requirements)) : null,
    applicationMethod: null,
    applicationUrl: raw.sourceUrl ? normalizeUrl(raw.sourceUrl) : null,
    referenceNumber: raw.referenceNumber ?? null,
    extra: { raw: raw.raw ?? {} },
    sourceUrl: normalizeUrl(raw.sourceUrl),
    sourceId: raw.sourceId,
  };
}

const CATEGORY_SIGNALS: Array<[RegExp, string]> = [
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

function inferCategory(text: string): string | null {
  return CATEGORY_SIGNALS.find(([signal]) => signal.test(text))?.[1] ?? null;
}

const COUNTRY_SIGNALS: Array<[RegExp, string]> = [
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

function inferCountryCode(text: string): string | null {
  return COUNTRY_SIGNALS.find(([signal]) => signal.test(text))?.[1] ?? null;
}

function normalizeCountryCode(value: string): string {
  const inferred = inferCountryCode(value);
  if (inferred) return inferred;
  const upper = value.trim().toUpperCase();
  if (upper === "UK") return "GB";
  if (upper === "USA") return "US";
  return upper.slice(0, 2);
}

function countryName(code: string): string {
  const labels: Record<string, string> = {
    GB: "United Kingdom",
    US: "United States",
    CA: "Canada",
    AU: "Australia",
    NZ: "New Zealand",
    NG: "Nigeria",
    GH: "Ghana",
    KE: "Kenya",
    UG: "Uganda",
    ZA: "South Africa",
    BJ: "Benin",
    RW: "Rwanda",
    TZ: "Tanzania",
    SN: "Senegal",
    ET: "Ethiopia",
    IN: "India",
    DE: "Germany",
    FR: "France",
    CH: "Switzerland",
    JP: "Japan",
  };
  return labels[code] ?? code;
}

function inferLabeledText(text: string, label: RegExp): string | null {
  const match = text.match(new RegExp(`${label.source}([^.;\\n]{8,600})`, "i"));
  return match?.[1]?.trim() ?? null;
}

function inferDeadline(text: string): string | null {
  const datePattern = /\b(\d{1,2}\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[, ]+\d{4})\b/i;
  const explicit = text.match(/(?:deadline|closing date|apply by|applications? close(?:s)?|due date)\s*[:\-–]?\s*([^.;\n]{0,40})/i);
  const matched = explicit?.[1]?.match(datePattern) ?? text.match(datePattern);
  if (!matched?.[1]) return null;
  const parsed = new Date(matched[1]);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function inferOrganization(title: string, listingText: string): string | null {
  const normalizedListing = normalizeWhitespace(listingText);
  const normalizedTitle = normalizeWhitespace(title);
  if (!normalizedListing || !normalizedTitle) return null;
  const titleOrganization = normalizedTitle.split(":").slice(1).join(":").trim();
  if (titleOrganization.length >= 3 && titleOrganization.length <= 160) return titleOrganization;
  const titleIndex = normalizedListing.toLowerCase().indexOf(normalizedTitle.toLowerCase());
  if (titleIndex < 0) return null;
  let suffix = normalizedListing.slice(titleIndex + normalizedTitle.length);
  suffix = suffix
    .replace(/\b(?:united kingdom|great britain|britain|u\.?k\.?|united states|u\.?s\.?a?\.?|nigeria|ghana|kenya|uganda|south africa|benin|rwanda|tanzania|senegal|ethiopia|india|germany|france|switzerland|japan)\b/gi, " ")
    .replace(/\b\d{1,2}\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[, ]+\d{4}\b/gi, " ")
    .replace(/[|,:–—-]/g, " ")
    .trim();
  const candidate = normalizeWhitespace(suffix);
  return candidate.length >= 3 && candidate.length <= 160 ? candidate : null;
}

function mapCategory(input: string | null | undefined): NormalizedOpportunity["category"] {
  const value = (input ?? "").toUpperCase();
  const allowed = new Set([
    "PROCUREMENT",
    "CONTRACTS",
    "GRANTS",
    "FUNDING",
    "EMPLOYMENT",
    "INTERNSHIPS",
    "SCHOLARSHIPS",
    "FELLOWSHIPS",
    "ACCELERATORS",
    "INCUBATORS",
    "COMPETITIONS",
    "TRAINING",
    "RESEARCH",
    "PARTNERSHIPS",
    "INVESTMENT",
    "DEVELOPMENT",
    "OTHER",
  ]);
  return (allowed.has(value) ? value : "OTHER") as NormalizedOpportunity["category"];
}

function mapOpportunityType(input: string | null | undefined): NormalizedOpportunity["opportunityType"] {
  const value = (input ?? "").toUpperCase();
  const categoryTypes: Record<string, string> = {
    SCHOLARSHIPS: "SCHOLARSHIP",
    FELLOWSHIPS: "FELLOWSHIP",
    INTERNSHIPS: "INTERNSHIP",
    GRANTS: "GRANT",
    ACCELERATORS: "ACCELERATOR",
    INCUBATORS: "INCUBATOR",
    COMPETITIONS: "COMPETITION",
  };
  if (categoryTypes[value]) return categoryTypes[value] as NormalizedOpportunity["opportunityType"];
  const allowed = new Set([
    "TENDER",
    "RFP",
    "RFQ",
    "CONTRACT",
    "GRANT",
    "FUNDING",
    "JOB",
    "INTERNSHIP",
    "SCHOLARSHIP",
    "FELLOWSHIP",
    "ACCELERATOR",
    "INCUBATOR",
    "COMPETITION",
    "HACKATHON",
    "TRAINING",
    "RESEARCH",
    "PARTNERSHIP",
    "INVESTMENT",
    "CONSULTANCY",
    "SUPPLIER",
    "VENDOR",
    "CALL_FOR_PROPOSALS",
    "OTHER",
  ]);
  return (allowed.has(value) ? value : "OTHER") as NormalizedOpportunity["opportunityType"];
}