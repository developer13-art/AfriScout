export type AiProviderName = "openai" | "anthropic" | "gemini" | "mock";

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

export interface AiResponseDTO {
  provider: AiProviderName;
  model: string;
  output: unknown;
  outputText: string;
  tokensInput: number | null;
  tokensOutput: number | null;
  costUsd: number | null;
  latencyMs: number;
  fallbackUsed: boolean;
}

export interface AskAfriScoutIntentDTO {
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