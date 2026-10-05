import type { AiProviderName } from "../config/ai";

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

export interface AiRequestInput {
  taskType: AiTaskType;
  promptVersion: string;
  systemPrompt?: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "json" | "text";
  requestId?: string;
}

export interface AiResponse {
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

export interface AiProvider {
  name: AiProviderName;
  isConfigured(): boolean;
  complete(input: AiRequestInput): Promise<AiResponse>;
}

export interface AiSummaryPayload {
  summary: string;
  eligibility: string;
  requirements: string[];
  documents: string[];
  risks: string[];
}

export interface AiAnalystPayload {
  recommendation: string;
  strengths: string[];
  concerns: string[];
  missingRequirements: string[];
  nextSteps: string[];
}

export interface AskAfriScoutIntentPayload {
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