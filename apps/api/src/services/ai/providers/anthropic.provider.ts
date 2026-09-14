import type { AiProvider } from "../provider.interface";
import type { AiRequestInput, AiResponse } from "../../../types/ai";
import { aiConfig } from "../../../config/ai";
import { InternalError } from "../../../utils/errors";

export const anthropicProvider: AiProvider = {
  name: "anthropic",

  isConfigured(): boolean {
    return aiConfig.providers.anthropic.apiKey.length > 0;
  },

  async complete(input: AiRequestInput): Promise<AiResponse> {
    const provider = aiConfig.providers.anthropic;
    if (!provider.apiKey) throw new InternalError("Anthropic key not configured");

    const started = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), aiConfig.requestTimeoutMs);

    try {
      const response = await fetch(`${provider.baseUrl}/v1/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": provider.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: provider.model,
          max_tokens: input.maxTokens ?? 1200,
          temperature: input.temperature ?? 0.2,
          system: input.systemPrompt,
          messages: [{ role: "user", content: input.userPrompt }],
        }),
        signal: controller.signal,
      });

      const json = (await response.json()) as {
        content?: { type: string; text?: string }[];
        usage?: { input_tokens?: number; output_tokens?: number };
      };

      if (!response.ok) {
        throw new InternalError(`Anthropic request failed (${response.status})`, json);
      }

      const content = json.content?.map((part) => part.text ?? "").join("") ?? "";
      let parsed: unknown = content;
      if (input.responseFormat === "json") {
        try {
          parsed = JSON.parse(content);
        } catch {
          parsed = { raw: content };
        }
      }

      return {
        provider: "anthropic",
        model: provider.model,
        output: parsed,
        outputText: content,
        tokensInput: json.usage?.input_tokens ?? null,
        tokensOutput: json.usage?.output_tokens ?? null,
        costUsd: null,
        latencyMs: Date.now() - started,
        fallbackUsed: false,
      };
    } finally {
      clearTimeout(timer);
    }
  },
};