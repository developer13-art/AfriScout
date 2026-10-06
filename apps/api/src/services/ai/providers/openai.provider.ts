import type { AiProvider } from "../provider.interface";
import type { AiRequestInput, AiResponse } from "../../../types/ai";
import { aiConfig } from "../../../config/ai";
import { InternalError } from "../../../utils/errors";

export const openAiProvider: AiProvider = {
  name: "openai",

  isConfigured(): boolean {
    return aiConfig.providers.openai.apiKey.length > 0;
  },

  async complete(input: AiRequestInput): Promise<AiResponse> {
    const provider = aiConfig.providers.openai;
    if (!provider.apiKey) throw new InternalError("OpenAI key not configured");

    const started = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), aiConfig.requestTimeoutMs);

    try {
      const response = await fetch(`${provider.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${provider.apiKey}`,
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
      };

      if (!response.ok) {
        throw new InternalError(`OpenAI request failed (${response.status})`, json);
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
        provider: "openai",
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