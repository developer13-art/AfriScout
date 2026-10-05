import { env } from "./env";

export type AiProviderName = "openai" | "anthropic" | "gemini" | "openrouter" | "mock";

export interface AiProviderConfig {
  name: AiProviderName;
  apiKey: string;
  model: string;
  baseUrl: string;
}

export interface AiConfig {
  enabled: boolean;
  chain: AiProviderName[];
  requestTimeoutMs: number;
  maxRetries: number;
  providers: Record<AiProviderName, AiProviderConfig>;
}

function buildChain(): AiProviderName[] {
  const candidates: (AiProviderName | "")[] = [
    env.AI_PROVIDER_PRIMARY,
    env.AI_PROVIDER_FALLBACK_1,
    env.AI_PROVIDER_FALLBACK_2,
    env.AI_PROVIDER_FALLBACK_3,
  ];
  const chain: AiProviderName[] = [];
  for (const name of candidates) {
    if (!name) continue;
    if (!chain.includes(name)) chain.push(name);
  }
  if (!chain.includes("mock")) chain.push("mock");
  return chain;
}

export const aiConfig: AiConfig = {
  enabled: env.AI_ENABLED,
  chain: buildChain(),
  requestTimeoutMs: env.AI_REQUEST_TIMEOUT_MS,
  maxRetries: env.AI_MAX_RETRIES,
  providers: {
    openai: {
      name: "openai",
      apiKey: env.OPENAI_API_KEY,
      model: env.OPENAI_MODEL,
      baseUrl: env.OPENAI_BASE_URL,
    },
    anthropic: {
      name: "anthropic",
      apiKey: env.ANTHROPIC_API_KEY,
      model: env.ANTHROPIC_MODEL,
      baseUrl: env.ANTHROPIC_BASE_URL,
    },
    gemini: {
      name: "gemini",
      apiKey: env.GEMINI_API_KEY,
      model: env.GEMINI_MODEL,
      baseUrl: env.GEMINI_BASE_URL,
    },
    openrouter: {
      name: "openrouter",
      apiKey: env.OPENROUTER_API_KEY,
      model: env.OPENROUTER_MODEL,
      baseUrl: env.OPENROUTER_BASE_URL,
    },    mock: {
      name: "mock",
      apiKey: "",
      model: "mock",
      baseUrl: "",
    },
  },
};