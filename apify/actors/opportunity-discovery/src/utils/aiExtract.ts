import { log } from "./logger.js";

export interface AiExtractedFields {
  title: string | null;
  organization: string | null;
  country: string | null;
  location: string | null;
  publishedAt: string | null;
  deadline: string | null;
  referenceNumber: string | null;
  valueMin: number | null;
  valueMax: number | null;
  currency: string | null;
  eligibility: string | null;
  requirements: string | null;
  description: string | null;
}

const EMPTY: AiExtractedFields = {
  title: null,
  organization: null,
  country: null,
  location: null,
  publishedAt: null,
  deadline: null,
  referenceNumber: null,
  valueMin: null,
  valueMax: null,
  currency: null,
  eligibility: null,
  requirements: null,
  description: null,
};

const GEMINI_MODEL = "gemini-1.5-flash";
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/" +
  GEMINI_MODEL +
  ":generateContent";

const PROMPT = `You extract structured opportunity data from a public listing.

Return strict JSON only. No prose. No markdown fences.

Fields:
- title: the opportunity title (short, factual, from the text)
- organization: the publishing organization, if visible
- country: two-letter ISO country code if a country is mentioned
- location: city, region, or country name as text
- publishedAt: ISO date (YYYY-MM-DD) if a publish date is mentioned
- deadline: ISO date (YYYY-MM-DD) if a deadline is mentioned
- referenceNumber: any reference or notice number visible
- valueMin: number, minimum value if a monetary range is shown
- valueMax: number, maximum value if a monetary range is shown
- currency: three-letter currency code if visible
- eligibility: who can apply, as text
- requirements: what is required, as text
- description: one paragraph summary, max 400 characters

If a field is not present, return null for it.

Item text:
"""

`;

async function callGemini(
  apiKey: string,
  text: string,
): Promise<AiExtractedFields> {
  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: PROMPT + text + '\n"""' }],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 800,
      responseMimeType: "application/json",
    },
  };

  const url = `${GEMINI_URL}?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const raw = await response.text();
    throw new Error(`Gemini ${response.status}: ${raw.slice(0, 200)}`);
  }

  const json = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };

  const textOut =
    json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ??
    "";

  let parsed: Partial<AiExtractedFields>;
  try {
    parsed = JSON.parse(textOut) as Partial<AiExtractedFields>;
  } catch {
    throw new Error(`Gemini returned non-JSON: ${textOut.slice(0, 200)}`);
  }

  return {
    title: normalizeString(parsed.title),
    organization: normalizeString(parsed.organization),
    country: normalizeCountry(parsed.country),
    location: normalizeString(parsed.location),
    publishedAt: normalizeDate(parsed.publishedAt),
    deadline: normalizeDate(parsed.deadline),
    referenceNumber: normalizeString(parsed.referenceNumber),
    valueMin: normalizeNumber(parsed.valueMin),
    valueMax: normalizeNumber(parsed.valueMax),
    currency: normalizeCurrency(parsed.currency),
    eligibility: normalizeString(parsed.eligibility),
    requirements: normalizeString(parsed.requirements),
    description: normalizeString(parsed.description),
  };
}

export async function extractWithAi(
  apiKey: string | undefined,
  text: string,
): Promise<AiExtractedFields> {
  if (!apiKey || apiKey.length < 10) return EMPTY;
  if (!text || text.trim().length < 20) return EMPTY;

  try {
    return await callGemini(apiKey, text.trim().slice(0, 6000));
  } catch (error) {
    log.warn("ai_extract_failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return EMPTY;
  }
}

export function heuristicFallback(text: string): AiExtractedFields {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return EMPTY;

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 10);

  const title = lines[0] ?? cleaned.slice(0, 120);

  const datePattern =
    /\b(\d{1,2}[-/ ](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[-/ ]\d{4}|\d{4}-\d{2}-\d{2})\b/gi;
  const dates = cleaned.match(datePattern) ?? [];

  return {
    ...EMPTY,
    title: title.slice(0, 200),
    deadline: dates[0] ? safeDate(dates[0]) : null,
    publishedAt: dates[1] ? safeDate(dates[1]) : null,
    description: cleaned.slice(0, 400),
  };
}

function normalizeString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  if (!str || str.toLowerCase() === "null") return null;
  return str.slice(0, 2000);
}

function normalizeCountry(value: unknown): string | null {
  const s = normalizeString(value);
  if (!s) return null;
  return s.length === 2 ? s.toUpperCase() : s;
}

function normalizeCurrency(value: unknown): string | null {
  const s = normalizeString(value);
  if (!s) return null;
  return s.length === 3 ? s.toUpperCase() : s;
}

function normalizeDate(value: unknown): string | null {
  const s = normalizeString(value);
  if (!s) return null;
  return safeDate(s);
}

function safeDate(value: string): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function normalizeNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}