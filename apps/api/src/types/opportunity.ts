import type {
  OpportunityCategoryKey,
  OpportunityTypeKey,
} from "../constants/categories";
import type { SystemLifecycleKey } from "../constants/lifecycles";

export type OpportunityStatus = "DRAFT" | "PUBLISHED" | "CLOSED" | "CANCELLED" | "ARCHIVED";

export type VerificationStatus = "UNVERIFIED" | "PARTIAL" | "VERIFIED" | "DISPUTED";

export interface OpportunityPayload {
  title: string;
  organizationName?: string | null;
  organizationId?: string | null;
  category: OpportunityCategoryKey;
  subcategory?: string | null;
  opportunityType: OpportunityTypeKey;
  countryCode?: string | null;
  region?: string | null;
  city?: string | null;
  locationText?: string | null;
  isRemote?: boolean;
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
  extra?: Record<string, unknown>;
}

export interface NormalizedOpportunity extends OpportunityPayload {
  sourceUrl: string;
  sourceId: string;
  publishedAt: string | null;
  deadline: string | null;
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

export interface OpportunitySearchQuery extends OpportunityFilters {
  page?: number;
  pageSize?: number;
  sort?: string;
}

export interface RawOpportunityRecord {
  id: string;
  sourceId: string;
  sourceRunId: string | null;
  apifyDatasetItemId: string | null;
  payload: Record<string, unknown>;
  payloadHash: string;
  fetchedAt: string;
  processedAt: string | null;
  processingStatus: "PENDING" | "PROCESSING" | "PROCESSED" | "FAILED" | "SKIPPED";
  processingError: string | null;
}

export interface RequirementPayload {
  kind:
    | "DOCUMENT"
    | "EXPERIENCE"
    | "CERTIFICATION"
    | "FINANCIAL"
    | "TECHNICAL"
    | "ELIGIBILITY"
    | "GEOGRAPHIC"
    | "LEGAL"
    | "OTHER";
  label: string;
  description?: string | null;
  isMandatory: boolean;
  source: "SOURCE_FACT" | "AI_INTERPRETATION";
}

export interface ChangeEventPayload {
  opportunityId: string;
  field: string;
  oldValue: unknown;
  newValue: unknown;
  severity: "NORMAL" | "IMPORTANT" | "CRITICAL";
}

export interface SystemLifecycleState {
  state: SystemLifecycleKey;
  at: string;
  reason?: string;
}