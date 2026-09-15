export interface ActorInput {
  sourceId: string;
  sourceUrl: string;
  sourceType: string;
  country?: string;
  category?: string;
  adapter: string;
  maxItems?: number;
  requestTimeoutSeconds?: number;
  // Path B additions
  waitUntil?: "load" | "domcontentloaded" | "networkidle" | "commit";
  waitForSelector?: string;
  waitExtraMs?: number;
}

export interface RawListingItem {
  url: string;
  title?: string;
  raw: Record<string, unknown>;
}

export interface ExtractedOpportunity {
  title: string;
  organization: string | null;
  country: string | null;
  location: string | null;
  category: string | null;
  publishedAt: string | null;
  deadline: string | null;
  description: string | null;
  sourceUrl: string;
  sourceName: string | null;
  sourceId: string;
  adapter: string;
  referenceNumber: string | null;
  valueMin: number | null;
  valueMax: number | null;
  currency: string | null;
  eligibility: string | null;
  requirements: string | null;
  documents: string[];
  raw: Record<string, unknown>;
}