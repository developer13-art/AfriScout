import type { OpportunityCategory } from "./opportunity";

export type SourceType =
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

export type SourceHealth =
  | "UNKNOWN"
  | "HEALTHY"
  | "WARNING"
  | "FAILED"
  | "INACTIVE";

export type CrawlFrequency =
  | "EVERY_6_HOURS"
  | "EVERY_12_HOURS"
  | "DAILY"
  | "WEEKLY"
  | "MANUAL";

export interface Source {
  id: string;
  name: string;
  slug: string;
  countryCode?: string | null;
  region?: string | null;
  language?: string | null;
  currency?: string | null;
  category?: OpportunityCategory | null;
  sourceType: SourceType;
  url: string;
  adapter: string;
  active: boolean;
  crawlFrequency: CrawlFrequency;
  attributionRequired: boolean;
  termsUrl?: string | null;
  notes?: string | null;
  health: SourceHealth;
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

export type SuggestionStatus =
  | "SUGGESTED"
  | "REVIEWED"
  | "VERIFIED"
  | "ACTIVATED"
  | "REJECTED";

export interface SourceSuggestion {
  id: string;
  suggestedBy?: string | null;
  name: string;
  url: string;
  countryCode?: string | null;
  category?: OpportunityCategory | null;
  notes?: string | null;
  status: SuggestionStatus;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
  createdAt: string;
}

export interface SourceAdapter {
  id: string;
  key: string;
  label: string;
  version: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SourceFilters {
  q?: string;
  countryCode?: string;
  category?: OpportunityCategory;
  sourceType?: SourceType;
  health?: SourceHealth;
  active?: boolean;
  crawlFrequency?: CrawlFrequency;
}