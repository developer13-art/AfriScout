export type AiProvider = "OPENAI" | "ANTHROPIC" | "GEMINI" | "MOCK";

export type AiTaskType =
  | "CLASSIFICATION"
  | "SUMMARY"
  | "ELIGIBILITY"
  | "REQUIREMENTS"
  | "DOCUMENT"
  | "RISK"
  | "RECOMMENDATIONS"
  | "ANALYST"
  | "SEARCH_INTENT"
  | "OTHER";

export type AiStatus =
  | "QUEUED"
  | "RUNNING"
  | "SUCCEEDED"
  | "FAILED"
  | "FALLBACK_USED";

export interface AiAnalysis {
  id: string;
  opportunityId?: string | null;
  opportunityVersion?: number | null;
  taskType: AiTaskType;
  provider: AiProvider;
  model: string;
  promptVersion: string;
  output: Record<string, unknown>;
  outputText?: string | null;
  confidence?: number | null;
  tokensInput?: number | null;
  tokensOutput?: number | null;
  costUsd?: number | null;
  latencyMs?: number | null;
  status: AiStatus;
  errorMessage?: string | null;
  createdAt: string;
}

export interface AiAnalystResult {
  recommendation: string;
  strengths: string[];
  concerns: string[];
  missingRequirements: string[];
  nextSteps: string[];
  provider: AiProvider;
  model: string;
  analyzedAt: string;
}

export interface AiSummary {
  summary: string;
  eligibility: string;
  requirements: string[];
  documents: string[];
  risks: string[];
  provider: AiProvider;
  model: string;
  generatedAt: string;
}

export interface AskAfriScoutIntent {
  q?: string;
  category?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  deadlineBefore?: string;
  deadlineAfter?: string;
  isRemote?: boolean;
  minValue?: number;
  maxValue?: number;
  currency?: string;
}