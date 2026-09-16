export interface ApifyActorInteraction {
  fill?: Array<{ selector: string; value: string }>;
  check?: Array<{ selector: string }>;
  click?: string;
  waitFor?: string;
  extraWaitMs?: number;
}

export interface ApifyActorInput {
  sourceId: string;
  sourceUrl: string;
  sourceType: string;
  country?: string;
  category?: string;
  adapter: string;
  maxItems?: number;
  requestTimeoutSeconds?: number;
  waitUntil?: "load" | "domcontentloaded" | "networkidle" | "commit";
  waitForSelector?: string;
  waitExtraMs?: number;
  interaction?: ApifyActorInteraction;
}

export interface ApifyActorOutputItem {
  title: string;
  organization?: string | null;
  country?: string | null;
  location?: string | null;
  category?: string | null;
  publishedAt?: string | null;
  deadline?: string | null;
  description?: string | null;
  sourceUrl: string;
  sourceName?: string | null;
  sourceId: string;
  adapter: string;
  referenceNumber?: string | null;
  valueMin?: number | null;
  valueMax?: number | null;
  currency?: string | null;
  eligibility?: string | null;
  requirements?: string | null;
  documents?: string[];
  raw?: Record<string, unknown>;
}

export interface ApifyRunRecord {
  id: string;
  actorId: string;
  status: "READY" | "RUNNING" | "SUCCEEDED" | "FAILED" | "ABORTED" | "TIMED-OUT";
  startedAt: string;
  finishedAt: string | null;
  defaultDatasetId: string | null;
  stats?: Record<string, unknown>;
}

export interface ApifyWebhookPayload {
  eventType: string;
  eventData: Record<string, unknown>;
  resource: Record<string, unknown>;
  createdAt: string;
}

export const APIFY_WEBHOOK_HEADER = "x-apify-webhook-signature";