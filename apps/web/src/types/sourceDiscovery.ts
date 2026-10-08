export type DiscoveryScope =
  | "GLOBAL"
  | "AFRICA"
  | "NORTH_AMERICA"
  | "EUROPE"
  | "ASIA"
  | "SOUTH_AMERICA"
  | "OCEANIA"
  | "CUSTOM";

export interface DiscoveryInput {
  scope: DiscoveryScope;
  countries?: string[];
  categories?: string[];
  sourceTypes?: string[];
  minimumScore: number;
}

export interface DiscoveryRun {
  id: string;
  status: string;
  scope: DiscoveryScope;
  countries: string[];
  categories: string[];
  sourceTypes: string[];
  minimumScore: number;
  queries: string[];
  resultCount: number;
  apifyRunId: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DiscoveryScores {
  officialIdentity?: number | null;
  domainAuthenticity?: number | null;
  relevance?: number | null;
  accessibility?: number | null;
  updateFrequency?: number | null;
  duplicateRisk?: number | null;
  overallConfidence?: number | null;
}

export interface CandidateEvidence {
  type?: string | null;
  label?: string | null;
  url?: string | null;
  detail?: string | null;
  snippet?: string | null;
  [key: string]: unknown;
}

export interface SourceCandidateMetadata {
  organization?: string | null;
  region?: string | null;
  sourceType?: string | null;
  sourceTypes?: string[] | null;
  categories?: string[] | null;
  industries?: string[] | null;
  topics?: string[] | null;
  languages?: string[] | null;
  opportunityTypes?: string[] | null;
  confidence?: number | null;
  scores?: DiscoveryScores | null;
  evidence?: (CandidateEvidence | string)[] | null;
  concerns?: (string | CandidateEvidence)[] | null;
  rationale?: string | null;
  recommendation?: string | null;
  searchQuery?: string | null;
  searchSnippet?: string | null;
  analysisMode?: string | null;
  verificationStatus?: string | null;
  duplicateSourceId?: string | null;
  duplicateSourceName?: string | null;
  duplicateSimilarity?: number | null;
  duplicateDecision?: string | null;
  approvedSourceId?: string | null;
  [key: string]: unknown;
}

export interface SourceCandidate {
  id: string;
  name: string;
  url: string;
  countryCode: string | null;
  category: string | null;
  notes: string | null;
  status: string;
  reviewNotes: string | null;
  createdAt: string;
  metadata?: SourceCandidateMetadata | null;
}

export interface DiscoveryOverviewStats {
  sourcesDiscovered: number;
  pendingReview: number;
  approved: number;
  active: number;
  needsAttention: number;
}

export interface Overview {
  stats: DiscoveryOverviewStats;
  runs: DiscoveryRun[];
  candidates: SourceCandidate[];
}

export interface DiscoveryRunWithCandidates extends DiscoveryRun {
  candidates: SourceCandidate[];
}

export type CandidateReviewAction =
  | "APPROVE"
  | "REJECT"
  | "IGNORE"
  | "KEEP_SEPARATE"
  | "MERGE";

export interface CandidateReviewInput {
  action: CandidateReviewAction;
  mergeSourceId?: string;
  notes?: string;
}

export interface SourceVerificationState {
  id: string;
  status: string;
  version: number;
  fingerprint: string;
  snapshot: Record<string, unknown>;
  createdAt: string;
}

export interface SourceRunSummary {
  id: string;
  status: string;
  trigger: string;
  itemsFound: number;
  itemsImported: number;
  itemsUpdated: number;
  itemsInvalid: number;
  errorMessage: string | null;
  createdAt: string;
}

export interface CandidateReviewResult {
  candidate: SourceCandidate;
  source?: {
    id: string;
    name: string;
    url: string;
    active: boolean;
    health: string;
    sourceVerification?: SourceVerificationState | null;
    runs?: SourceRunSummary[];
  };
}
