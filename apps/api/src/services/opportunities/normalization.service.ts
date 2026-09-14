import type { ApifyActorOutputItem } from "../../types/apify";
import type { NormalizedOpportunity } from "../../types/opportunity";
import { toIsoOrNull } from "../../utils/date";
import { normalizeCurrencyCode } from "../../utils/currency";
import { normalizeWhitespace, stripHtml, truncate } from "../../utils/string";
import { normalizeUrl } from "../../utils/url";

export function normalizeOpportunity(
  raw: ApifyActorOutputItem,
): NormalizedOpportunity {
  return {
    title: normalizeWhitespace(stripHtml(raw.title ?? "")) || "Untitled opportunity",
    organizationName: raw.organization ? normalizeWhitespace(raw.organization) : null,
    organizationId: null,
    category: mapCategory(raw.category),
    subcategory: null,
    opportunityType: mapOpportunityType(raw.category),
    countryCode: raw.country ? raw.country.toUpperCase().slice(0, 2) : null,
    region: null,
    city: raw.location ? normalizeWhitespace(raw.location) : null,
    locationText: raw.location ? normalizeWhitespace(raw.location) : null,
    isRemote: false,
    description: raw.description ? truncate(stripHtml(raw.description), 20000) : null,
    summaryShort: raw.description ? truncate(stripHtml(raw.description), 220) : null,
    valueMin: raw.valueMin ?? null,
    valueMax: raw.valueMax ?? null,
    currency: normalizeCurrencyCode(raw.currency ?? null),
    publishedAt: toIsoOrNull(raw.publishedAt),
    deadline: toIsoOrNull(raw.deadline),
    eligibility: raw.eligibility ? normalizeWhitespace(stripHtml(raw.eligibility)) : null,
    requirements: raw.requirements ? normalizeWhitespace(stripHtml(raw.requirements)) : null,
    applicationMethod: null,
    applicationUrl: raw.sourceUrl ? normalizeUrl(raw.sourceUrl) : null,
    referenceNumber: raw.referenceNumber ?? null,
    extra: { raw: raw.raw ?? {} },
    sourceUrl: normalizeUrl(raw.sourceUrl),
    sourceId: raw.sourceId,
  };
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