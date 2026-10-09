import type { OpportunityCategoryKey } from "../constants/opportunityCategories";
import type { OpportunityTypeKey } from "../constants/opportunityTypes";
import type { SystemLifecycleKey } from "../constants/lifecycles";

export type OpportunityStatus = "DRAFT" | "PUBLISHED" | "CLOSED" | "CANCELLED" | "ARCHIVED";
export type VerificationStatus = "UNVERIFIED" | "PARTIAL" | "VERIFIED" | "DISPUTED";

export interface OpportunityDTO {
  id: string;
  title: string;
  slug: string;
  organizationId?: string | null;
  organizationName?: string | null;
  category: OpportunityCategoryKey;
  subcategory?: string | null;
  opportunityType: OpportunityTypeKey;
  countryCode?: string | null;
  region?: string | null;
  city?: string | null;
  locationText?: string | null;
  isRemote: boolean;
  description?: string | null;
  summaryShort?: string | null;
  valueMin?: number | null;
  valueMax?: number | null;
  currency?: string | null;
  publishedAt?: string | null;
  deadline?: string | null;
  eligibility?: string | null;
  requirements?: string | null;
  applicationMethod?: string | null;
  applicationUrl?: string | null;
  referenceNumber?: string | null;
  status: OpportunityStatus;
  systemState: SystemLifecycleKey;
  verificationStatus: VerificationStatus;
  aiProcessed: boolean;
  aiProcessedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OpportunitySourceLinkDTO {
  id: string;
  opportunityId: string;
  sourceId: string;
  sourceUrl: string;
  sourceTitle?: string | null;
  publishedAt?: string | null;
  deadline?: string | null;
  isPrimary: boolean;
  lastSeenAt: string;
}

export interface OpportunityFilters {
  q?: string;
  category?: OpportunityCategoryKey;
  opportunityType?: OpportunityTypeKey;
  countryCode?: string;
  region?: string;
  city?: string;
  isRemote?: boolean;
  minValue?: number;
  maxValue?: number;
  currency?: string;
  publishedAfter?: string;
  deadlineBefore?: string;
  deadlineAfter?: string;
  status?: OpportunityStatus;
  verificationStatus?: VerificationStatus;
  organizationId?: string;
  sourceId?: string;
}

export interface OpportunitySearchResultDTO {
  items: OpportunityDTO[];
  total: number;
  page: number;
  pageSize: number;
}