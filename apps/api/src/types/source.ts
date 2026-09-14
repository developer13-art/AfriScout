import type { OpportunityCategoryKey } from "../constants/categories";
import type {
  CrawlFrequencyKey,
  SourceHealthKey,
} from "../constants/sourceHealth";

export type SourceTypeKey =
  | "GOVERNMENT"
  | "PROCUREMENT_PORTAL"
  | "UNIVERSITY"
  | "NGO"
  | "FOUNDATION"
  | "ACCELERATOR"
  | "GRANT_PORTAL"
  | "JOB_BOARD"
  | "SCHOLARSHIP_PORTAL"
  | "DEVELOPMENT_ORG"
  | "PRIVATE_COMPANY"
  | "OTHER";

export interface SourceDescriptor {
  id: string;
  name: string;
  slug: string;
  countryCode?: string | null;
  region?: string | null;
  language?: string | null;
  currency?: string | null;
  category?: OpportunityCategoryKey | null;
  sourceType: SourceTypeKey;
  url: string;
  adapter: string;
  active: boolean;
  crawlFrequency: CrawlFrequencyKey;
  attributionRequired: boolean;
  termsUrl?: string | null;
  notes?: string | null;
  health: SourceHealthKey;
  lastSuccessAt?: string | null;
  lastFailureAt?: string | null;
  lastRunAt?: string | null;
  consecutiveFailures: number;
  successCount: number;
  failureCount: number;
  itemsTotal: number;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SourceInput {
  name: string;
  url: string;
  adapter: string;
  countryCode?: string;
  region?: string;
  language?: string;
  currency?: string;
  category?: OpportunityCategoryKey;
  sourceType: SourceTypeKey;
  crawlFrequency?: CrawlFrequencyKey;
  attributionRequired?: boolean;
  termsUrl?: string;
  notes?: string;
  active?: boolean;
}

export interface SourceAdapterInfo {
  key: string;
  label: string;
  version: string;
  description?: string;
  sourceTypes: SourceTypeKey[];
}

export interface SourceSuggestionRecord {
  id: string;
  suggestedBy?: string | null;
  name: string;
  url: string;
  countryCode?: string | null;
  category?: OpportunityCategoryKey | null;
  notes?: string | null;
  status: "SUGGESTED" | "REVIEWED" | "VERIFIED" | "ACTIVATED" | "REJECTED";
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
  createdAt: string;
}