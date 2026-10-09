import { aiConfig } from "../../config/ai";
import { configuredChain } from "../ai/provider.registry";
import { runAi } from "../ai/ai.service";

export interface DiscoverySearchResult {
  id: string;
  title: string;
  url: string;
  description: string;
  query: string;
}

export interface CandidateAssessment {
  organization: string | null;
  region: string | null;
  countryCode: string | null;
  sourceType: string | null;
  sourceTypes: string[];
  categories: string[];
  industries: string[];
  topics: string[];
  languages: string[];
  opportunityTypes: string[];
  confidence: number;
  scores: {
    officialIdentity: number | null;
    domainAuthenticity: number | null;
    relevance: number | null;
    accessibility: number | null;
    updateFrequency: number | null;
    duplicateRisk: number | null;
    overallConfidence: number;
  };
  evidence: Array<{ label: string; detail: string; url?: string }>;
  concerns: string[];
  rationale: string;
  recommendation: string;
  analysisMode: "AI_ASSESSMENT" | "HEURISTIC_SCREENING";
}

const SOURCE_DISCOVERY_PROMPT_VERSION = "source-discovery-assessment.v1";

const CATEGORY_TERMS: Record<string, string[]> = {
  JOBS: ["job", "jobs", "career", "careers", "employment", "vacancy", "vacancies"],
  GRANTS: ["grant", "grants", "funding", "fund"],
  SCHOLARSHIPS: ["scholarship", "scholarships", "bursary", "bursaries"],
  FELLOWSHIPS: ["fellowship", "fellowships"],
  PROCUREMENT: ["procurement", "tender", "tenders", "rfp", "rfq", "contract"],
  TENDERS: ["tender", "tenders", "procurement"],
  CONTRACTS: ["contract", "contracts", "procurement"],
  HACKATHONS: ["hackathon", "hackathons"],
  BOUNTIES: ["bounty", "bounties"],
  ACCELERATORS: ["accelerator", "accelerators", "incubator", "incubators"],
  RESEARCH: ["research", "researcher", "researchers"],
  STARTUP_PROGRAMS: ["startup", "start-up", "entrepreneur", "founder"],
  DEVELOPER_PROGRAMS: ["developer", "developers", "builder", "builders"],
  WEB3: ["web3", "blockchain", "crypto", "solana", "protocol"],
  OPEN_SOURCE: ["open source", "open-source", "opensource"],
};

const TYPE_TERMS: Record<string, string[]> = {
  GOVERNMENT: ["government", "ministry", "public agency", "official portal"],
  UNIVERSITY: ["university", "universities", "college", "research institution"],
  COMPANY: ["company", "companies", "corporate", "employer"],
  NGO: ["ngo", "nonprofit", "non-profit", "civil society"],
  FOUNDATION: ["foundation", "philanthropic"],
  PROTOCOL: ["protocol", "blockchain", "web3"],
  ECOSYSTEM: ["ecosystem", "startup network", "innovation hub"],
  COMMUNITY: ["community", "community organization"],
  RESEARCH_INSTITUTION: ["research institute", "research institution", "laboratory"],
};

const DOMAIN_AUTHORITY_SIGNALS: Array<{ pattern: RegExp; score: number; label: string }> = [
  { pattern: /\.gov(?:\.[a-z]{2})?$/i, score: 88, label: "Government-style domain signal; this is not proof of ownership." },
  { pattern: /\.edu(?:\.[a-z]{2})?$/i, score: 84, label: "Education-style domain signal; this is not proof of ownership." },
  { pattern: /\.ac\.[a-z]{2}$/i, score: 80, label: "Academic-style domain signal; this is not proof of ownership." },
  { pattern: /\.org$/i, score: 68, label: "Organization-style domain signal; this is not proof of ownership." },
];

export function buildDiscoveryQueries(input: {
  scope: string;
  countries: string[];
  categories: string[];
  sourceTypes: string[];
}): string[] {
  const locations = input.countries.length
    ? input.countries.map(countrySearchName)
    : input.scope === "GLOBAL"
      ? ["global"]
      : [input.scope.replace(/_/g, " ").toLowerCase()];
  const categories = input.categories.length
    ? input.categories.map((category) => category.trim().toUpperCase())
    : ["JOBS", "GRANTS", "SCHOLARSHIPS", "PROCUREMENT", "HACKATHONS", "BOUNTIES"];
  const sourceTypes = input.sourceTypes.length
    ? input.sourceTypes.map((sourceType) => sourceType.trim().toUpperCase())
    : ["GOVERNMENT", "UNIVERSITY", "COMPANY", "NGO", "FOUNDATION", "ECOSYSTEM"];

  const combinations = locations.flatMap((location) =>
    categories.flatMap((category) =>
      sourceTypes.map((sourceType) => ({
        location,
        category: categorySearchPhrase(category),
        sourceType: typeSearchPhrase(sourceType),
      })),
    ),
  );
  const selected = combinations.length <= 40
    ? combinations
    : Array.from({ length: 40 }, (_, index) =>
        combinations[Math.floor((index * combinations.length) / 40)],
      );
  const queries = new Set(
    selected.map(({ location, category, sourceType }) =>
      `${location} ${category} opportunities ${sourceType}`.trim(),
    ),
  );

  for (const { location, category, sourceType } of selected) {
    if (queries.size >= 40) break;
    queries.add(`${location} official ${category} portal ${sourceType}`.trim());
  }
  return [...queries].slice(0, 40);
}

export function extractSearchResults(items: Array<Record<string, unknown>>): DiscoverySearchResult[] {
  const results: DiscoverySearchResult[] = [];

  for (const item of items) {
    const itemQuery = readString(item.searchString) ??
      readString(item.query) ??
      readNestedString(item.searchQuery, ["term", "query", "searchString"]) ??
      "";
    const nested = [item.organicResults, item.results, item.organic];
    let foundNested = false;
    for (const value of nested) {
      if (!Array.isArray(value)) continue;
      foundNested = true;
      for (const result of value) {
        if (!isRecord(result)) continue;
        const candidate = toSearchResult(result, itemQuery);
        if (candidate) results.push(candidate);
      }
    }
    if (!foundNested) {
      const candidate = toSearchResult(item, itemQuery);
      if (candidate) results.push(candidate);
    }
  }

  const byHost = new Map<string, DiscoverySearchResult>();
  for (const result of results) {
    const key = getHost(result.url);
    if (!key || byHost.has(key)) continue;
    byHost.set(key, { ...result, id: `candidate-${byHost.size + 1}` });
    if (byHost.size >= 80) break;
  }
  return [...byHost.values()];
}

export function countrySearchName(value: string): string {
  const trimmed = value.trim();
  if (!/^[A-Za-z]{2}$/.test(trimmed)) return trimmed;
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(trimmed.toUpperCase()) ?? trimmed;
  } catch {
    return trimmed;
  }
}

export async function assessSearchResults(
  results: DiscoverySearchResult[],
): Promise<CandidateAssessment[]> {
  const realProviderAvailable =
    aiConfig.enabled && configuredChain().some((provider) => provider.name !== "mock");

  if (realProviderAvailable && results.length > 0) {
    try {
      const response = await runAi({
        taskType: "OTHER",
        promptVersion: SOURCE_DISCOVERY_PROMPT_VERSION,
        systemPrompt:
          "You assess potential public opportunity-publisher websites for a human review queue. Treat every search result as unverified evidence. Never state that a website, domain, organization, or source is officially verified. Do not invent facts. Use only each provided title, URL, description, and search query. Set unknown values and unobservable scores to null. Return valid JSON only.",
        userPrompt: [
          "Assess these search-result records. Return {\"assessments\":[...]} with one object per input id.",
          "For every result, automatically identify the best-supported publisher country, opportunity categories, and publisher/source types from the supplied evidence. The administrator does not provide those classifications. Use ISO alpha-2 for countryCode; use an empty array when a category or type is not supported, and null for an unknown country.",
          "Each object: id, organization (string|null), region (string|null), countryCode (ISO alpha-2|null), sourceType (string|null), sourceTypes (string[]), categories (string[]), industries (string[]), topics (string[]), languages (string[]), opportunityTypes (string[]), scores {officialIdentity,domainAuthenticity,relevance,accessibility,updateFrequency,overallConfidence} using 0-100 or null, evidence (string[]), concerns (string[]), rationale (string), recommendation (string).",
          "Scores are estimates from snippets, not verification. Do not infer current accessibility or update frequency from search indexing; use null for those. Overall confidence should reflect only provided evidence and must remain conservative.",
          JSON.stringify(results.map((result) => ({
            id: result.id,
            title: result.title.slice(0, 240),
            url: result.url,
            description: result.description.slice(0, 700),
            query: result.query.slice(0, 200),
          }))),
        ].join("\n\n"),
        temperature: 0.1,
        maxTokens: 6000,
        responseFormat: "json",
      });

      if (response.provider !== "mock") {
        const output = isRecord(response.output) ? response.output : {};
        const assessments = Array.isArray(output.assessments) ? output.assessments : [];
        const byId = new Map<string, Record<string, unknown>>();
        for (const assessment of assessments) {
          if (isRecord(assessment) && typeof assessment.id === "string") {
            byId.set(assessment.id, assessment);
          }
        }
        if (byId.size > 0) {
          return results.map((result) => {
            const assessment = byId.get(result.id);
            return assessment
              ? assessmentFromAi(result, assessment)
              : heuristicAssessment(result);
          });
        }
      }
    } catch {
      // Preserve candidate discovery when the configured AI provider is unavailable.
    }
  }

  return results.map(heuristicAssessment);
}

export function normalizedCandidateUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname || url.hostname === "localhost") return null;
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_.+|fbclid|gclid|ref|source)$/i.test(key)) url.searchParams.delete(key);
    }
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return url.toString();
  } catch {
    return null;
  }
}

export function getHost(value: string): string | null {
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function nameSimilarity(left: string, right: string): number {
  const words = (value: string) =>
    new Set(value.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((word) => word.length > 2));
  const a = words(left);
  const b = words(right);
  if (a.size === 0 || b.size === 0) return 0;
  const intersection = [...a].filter((word) => b.has(word)).length;
  return Math.round((intersection / new Set([...a, ...b]).size) * 100);
}

export function canonicalCategory(value: string): string {
  const normalized = value.trim().toUpperCase().replace(/[\s-]+/g, "_");
  const aliases: Record<string, string> = {
    JOB: "EMPLOYMENT",
    JOBS: "EMPLOYMENT",
    CAREERS: "EMPLOYMENT",
    TENDER: "PROCUREMENT",
    TENDERS: "PROCUREMENT",
    RFPS: "PROCUREMENT",
    RFQS: "PROCUREMENT",
    STARTUP_PROGRAMS: "ACCELERATORS",
    BOUNTIES: "DEVELOPMENT",
    HACKATHONS: "COMPETITIONS",
  };
  return aliases[normalized] ?? normalized.slice(0, 60);
}

function assessmentFromAi(
  result: DiscoverySearchResult,
  assessment: Record<string, unknown>,
): CandidateAssessment {
  const domainScore = numericValue(assessment.scores, "domainAuthenticity");
  const relevance = numericValue(assessment.scores, "relevance");
  const overall = numericValue(assessment.scores, "overallConfidence");
  const evidence: CandidateAssessment["evidence"] = stringArray(assessment.evidence).map((detail) => ({
    label: "AI assessment evidence",
    detail,
  }));
  evidence.push({ label: "Search result", detail: result.description || result.title, url: result.url });
  evidence.push({ label: "Discovery query", detail: result.query });
  const concerns = stringArray(assessment.concerns);
  concerns.push("Search-result evidence only; publisher identity has not been independently verified.");
  concerns.push("Live accessibility and update frequency were not tested.");
  const confidence = overall ?? Math.round(((domainScore ?? 50) + (relevance ?? 50)) / 2);
  return {
    organization: readString(assessment.organization),
    region: readString(assessment.region),
    countryCode: normalizeCountryCode(assessment.countryCode),
    sourceType: readString(assessment.sourceType),
    sourceTypes: stringArray(assessment.sourceTypes),
    categories: stringArray(assessment.categories).map(canonicalCategory),
    industries: stringArray(assessment.industries),
    topics: stringArray(assessment.topics),
    languages: stringArray(assessment.languages),
    opportunityTypes: stringArray(assessment.opportunityTypes),
    confidence,
    scores: {
      officialIdentity: numericValue(assessment.scores, "officialIdentity"),
      domainAuthenticity: domainScore,
      relevance,
      accessibility: null,
      updateFrequency: null,
      duplicateRisk: null,
      overallConfidence: confidence,
    },
    evidence,
    concerns,
    rationale: readString(assessment.rationale) ?? "AI assessed the public search-result metadata.",
    recommendation: readString(assessment.recommendation) ?? "Review the publisher and its official content before approval.",
    analysisMode: "AI_ASSESSMENT",
  };
}

function heuristicAssessment(result: DiscoverySearchResult): CandidateAssessment {
  const combined = `${result.title} ${result.description} ${result.query}`.toLowerCase();
  const host = getHost(result.url) ?? "";
  const categoryHits = Object.entries(CATEGORY_TERMS)
    .map(([category, terms]) => ({
      category,
      count: terms.filter((term) => combined.includes(term)).length,
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 4)
    .map((item) => canonicalCategory(item.category));
  const detectedType = Object.entries(TYPE_TERMS).find(([, terms]) =>
    terms.some((term) => combined.includes(term)),
  )?.[0] ?? null;
  const domainSignal = DOMAIN_AUTHORITY_SIGNALS.find((signal) => signal.pattern.test(host));
  const relevance = Math.min(90, 35 + categoryHits.length * 12 + (combined.includes("opportunit") ? 10 : 0));
  const authenticity = domainSignal?.score ?? 52;
  const confidence = Math.round((relevance * 0.65) + (authenticity * 0.35));
  const evidence = [
    { label: "Search result", detail: result.description || result.title, url: result.url },
    { label: "Discovery query", detail: result.query },
  ];
  if (domainSignal) {
    evidence.push({ label: "Domain signal", detail: domainSignal.label });
  }
  return {
    organization: null,
    region: null,
    countryCode: null,
    sourceType: detectedType,
    sourceTypes: detectedType ? [detectedType] : [],
    categories: categoryHits,
    industries: [],
    topics: [],
    languages: [],
    opportunityTypes: [],
    confidence,
    scores: {
      officialIdentity: null,
      domainAuthenticity: authenticity,
      relevance,
      accessibility: null,
      updateFrequency: null,
      duplicateRisk: null,
      overallConfidence: confidence,
    },
    evidence,
    concerns: [
      "Rule-based screening used because no real AI provider is configured.",
      "Publisher identity has not been independently verified.",
      "Live accessibility and update frequency were not tested.",
    ],
    rationale: "Screening score is based on search title, snippet, query terms, and public domain suffix signals.",
    recommendation: "Review the publisher, organization details, and active opportunity listings before approval.",
    analysisMode: "HEURISTIC_SCREENING",
  };
}

function categorySearchPhrase(value: string): string {
  const key = value.toUpperCase().replace(/[\s-]+/g, "_");
  const phrases: Record<string, string> = {
    JOBS: "jobs careers vacancies",
    GRANTS: "grants funding calls",
    SCHOLARSHIPS: "scholarships education funding",
    FELLOWSHIPS: "fellowships programs",
    PROCUREMENT: "public procurement",
    TENDERS: "public tenders",
    CONTRACTS: "contracts RFP",
    HACKATHONS: "hackathons competitions",
    BOUNTIES: "developer bounties",
    ACCELERATORS: "accelerators startup programs",
    RESEARCH: "research funding calls",
    STARTUP_PROGRAMS: "startup founder programs",
    DEVELOPER_PROGRAMS: "developer programs",
    WEB3: "Web3 blockchain opportunities",
    OPEN_SOURCE: "open source funding programs",
  };
  return phrases[key] ?? value.toLowerCase().replace(/_/g, " ");
}

function typeSearchPhrase(value: string): string {
  const key = value.toUpperCase().replace(/[\s-]+/g, "_");
  const phrases: Record<string, string> = {
    GOVERNMENT: "government public sector",
    UNIVERSITY: "university institution",
    COMPANY: "company employer",
    NGO: "NGO nonprofit",
    FOUNDATION: "foundation",
    PROTOCOL: "protocol ecosystem",
    ECOSYSTEM: "ecosystem network",
    COMMUNITY: "community",
    RESEARCH_INSTITUTION: "research institution",
  };
  return phrases[key] ?? value.toLowerCase().replace(/_/g, " ");
}

function toSearchResult(item: Record<string, unknown>, query: string): DiscoverySearchResult | null {
  const url = readString(item.url) ?? readString(item.link) ?? readString(item.href);
  const title = readString(item.title) ?? readString(item.name);
  if (!url || !title) return null;
  const normalized = normalizedCandidateUrl(url);
  if (!normalized) return null;
  return {
    id: "",
    title: title.slice(0, 240),
    url: normalized,
    description: (
      readString(item.description) ??
      readString(item.snippet) ??
      readString(item.text) ??
      ""
    ).slice(0, 1200),
    query: query.slice(0, 240),
  };
}

function normalizeCountryCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(normalized) ? normalized : null;
}

function numericValue(record: unknown, key: string): number | null {
  if (!isRecord(record)) return null;
  const value = record[key];
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const normalized = value >= 0 && value <= 1 ? value * 100 : value;
  return Math.round(Math.max(0, Math.min(100, normalized)));
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean).slice(0, 12);
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readNestedString(value: unknown, keys: string[]): string | null {
  if (!isRecord(value)) return null;
  for (const key of keys) {
    const result = readString(value[key]);
    if (result) return result;
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
