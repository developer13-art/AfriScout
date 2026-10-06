import type { OpportunityCategoryKey } from "../constants/opportunityCategories";
import type { CrawlFrequencyKey, SourceHealthKey } from "../constants/sourceHealthStatus";
import type { SourceTypeKey } from "../constants/sourceTypes";

export interface SourceDTO {
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