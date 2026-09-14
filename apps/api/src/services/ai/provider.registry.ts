import type { AiProvider } from "./provider.interface";
import { aiConfig, type AiProviderName } from "../../config/ai";
import { openAiProvider } from "./providers/openai.provider";
import { anthropicProvider } from "./providers/anthropic.provider";
import { geminiProvider } from "./providers/gemini.provider";
import { mockProvider } from "./providers/mock.provider";

const providers: Record<AiProviderName, AiProvider> = {
  openai: openAiProvider,
  anthropic: anthropicProvider,
  gemini: geminiProvider,
  mock: mockProvider,
};

export function getProvider(name: AiProviderName): AiProvider {
  return providers[name];
}

export function configuredChain(): AiProvider[] {
  return aiConfig.chain
    .map((name) => providers[name])
    .filter((provider) => provider.isConfigured());
}

export function providerNames(): AiProviderName[] {
  return aiConfig.chain.slice();
}