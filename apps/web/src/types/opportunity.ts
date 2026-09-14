export type OpportunityCategory =
  | "PROCUREMENT"
  | "CONTRACTS"
  | "GRANTS"
  | "FUNDING"
  | "EMPLOYMENT"
  | "INTERNSHIPS"
  | "SCHOLARSHIPS"
  | "FELLOWSHIPS"
  | "ACCELERATORS"
  | "INCUBATORS"
  | "COMPETITIONS"
  | "TRAINING"
  | "RESEARCH"
  | "PARTNERSHIPS"
  | "INVESTMENT"
  | "DEVELOPMENT"
  | "OTHER";

export type OpportunityType =
  | "TENDER"
  | "RFP"
  | "RFQ"
  | "CONTRACT"
  | "GRANT"
  | "FUNDING"
  | "JOB"
  | "INTERNSHIP"
  | "SCHOLARSHIP"
  | "FELLOWSHIP"
  | "ACCELERATOR"
  | "INCUBATOR"
  | "COMPETITION"
  | "HACKATHON"
  | "TRAINING"
  | "RESEARCH"
  | "PARTNERSHIP"
  | "INVESTMENT"
  | "CONSULTANCY"
  | "SUPPLIER"
  | "VENDOR"
  | "CALL_FOR_PROPOSALS"
  | "OTHER";

export type OpportunityStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "CLOSED"
  | "CANCELLED"
  | "ARCHIVED";

export type SystemLifecycle =
  | "DISCOVERED"
  | "RAW"
  | "NORMALIZED"
  | "VALIDATED"
  | "DEDUPLICATED"
  | "VERIFIED"
  | "ANALYZED"
  | "PUBLISHED"
  | "MONITORED"
  | "UPDATED"
  | "EXPIRED";

export type VerificationStatus =
  | "UNVERIFIED"
  | "PARTIAL"
  | "VERIFIED"
  | "DISPUTED";

export interface Opportunity {
  id: string;
  title: string;
  slug: string;
  organizationId?: string | null;
  organizationName?: string | null;
  category: OpportunityCategory;
  subcategory?: string | null;
  opportunityType: OpportunityType;
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
  systemState: SystemLifecycle;
  verificationStatus: VerificationStatus;
  aiProcessed: boolean;
  aiProcessedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OpportunitySourceLink {
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

export interface OpportunityDocument {
  id: string;
  opportunityId: string;
  url: string;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  extractionStatus:
    | "PENDING"
    | "FETCHING"
    | "EXTRACTING"
    | "EXTRACTED"
    | "FAILED"
    | "SKIPPED";
  extractedFields?: Record<string, unknown> | null;
  createdAt: string;
}

export type RequirementKind =
  | "DOCUMENT"
  | "EXPERIENCE"
  | "CERTIFICATION"
  | "FINANCIAL"
  | "TECHNICAL"
  | "ELIGIBILITY"
  | "GEOGRAPHIC"
  | "LEGAL"
  | "OTHER";

export type RequirementSource = "SOURCE_FACT" | "AI_INTERPRETATION";

export interface OpportunityRequirement {
  id: string;
  opportunityId: string;
  kind: RequirementKind;
  label: string;
  description?: string | null;
  isMandatory: boolean;
  source: RequirementSource;
  createdAt: string;
}

export interface OpportunityVersion {
  id: string;
  opportunityId: string;
  version: number;
  snapshot: Record<string, unknown>;
  createdAt: string;
}

export type ChangeSeverity = "NORMAL" | "IMPORTANT" | "CRITICAL";

export interface OpportunityChange {
  id: string;
  opportunityId: string;
  fromVersion?: number | null;
  toVersion?: number | null;
  field: string;
  oldValue?: unknown;
  newValue?: unknown;
  severity: ChangeSeverity;
  detectedAt: string;
  notified: boolean;
}

export interface OpportunityFilters {
  q?: string;
  category?: OpportunityCategory;
  opportunityType?: OpportunityType;
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

export interface OpportunitySearchResult {
  items: Opportunity[];
  total: number;
  page: number;
  pageSize: number;
}