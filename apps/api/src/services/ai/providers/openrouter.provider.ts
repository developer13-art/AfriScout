import type { AiProvider } from "../provider.interface";
import type { AiRequestInput, AiResponse } from "../../../types/ai";
import { aiConfig } from "../../../config/ai";
import { env } from "../../../config/env";
import { InternalError } from "../../../utils/errors";

export const openRouterProvider: AiProvider = {
  name: "openrouter",

  isConfigured(): boolean {
    return aiConfig.providers.openrouter.apiKey.length > 0;
  },

  async complete(input: AiRequestInput): Promise<AiResponse> {
    const provider = aiConfig.providers.openrouter;
    if (!provider.apiKey) {
      throw new InternalError("OpenRouter key not configured");
    }

    const started = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), aiConfig.requestTimeoutMs);

    try {
      const response = await fetch(`${provider.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${provider.apiKey}`,
          "HTTP-Referer": env.OPENROUTER_HTTP_REFERER,
          "X-Title": env.OPENROUTER_APP_TITLE,
        },
        body: JSON.stringify({
          model: provider.model,
          messages: [
            input.systemPrompt
              ? { role: "system", content: input.systemPrompt }
              : undefined,
            { role: "user", content: input.userPrompt },
          ].filter(Boolean),
          temperature: input.temperature ?? 0.2,
          max_tokens: input.maxTokens ?? 1200,
          response_format:
            input.responseFormat === "json"
              ? { type: "json_object" }
              : undefined,
        }),
        signal: controller.signal,
      });

      const json = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
        usage?: { prompt_tokens?: number; completion_tokens?: number };
        error?: { message?: string; code?: string };
      };

      if (!response.ok) {
        throw new InternalError(
          `OpenRouter request failed (${response.status})${
            json.error?.message ? `: ${json.error.message}` : ""
          }`,
          json,
        );
      }

      const content = json.choices?.[0]?.message?.content ?? "";
      let parsed: unknown = content;
      if (input.responseFormat === "json") {
        try {
          parsed = JSON.parse(content);
        } catch {
          parsed = { raw: content };
        }
      }

      return {
        provider: "openrouter",
        model: provider.model,
        output: parsed,
        outputText: content,
        tokensInput: json.usage?.prompt_tokens ?? null,
        tokensOutput: json.usage?.completion_tokens ?? null,
        costUsd: null,
        latencyMs: Date.now() - started,
        fallbackUsed: false,
      };
    } finally {
      clearTimeout(timer);
    }
  },
};