import type { AiProvider } from "../provider.interface";
import type { AiRequestInput, AiResponse } from "../../../types/ai";
import { aiConfig } from "../../../config/ai";
import { InternalError } from "../../../utils/errors";

export const geminiProvider: AiProvider = {
  name: "gemini",

  isConfigured(): boolean {
    return aiConfig.providers.gemini.apiKey.length > 0;
  },

  async complete(input: AiRequestInput): Promise<AiResponse> {
    const provider = aiConfig.providers.gemini;
    if (!provider.apiKey) throw new InternalError("Gemini key not configured");

    const started = Date.now();
    const url = `${provider.baseUrl}/v1beta/models/${provider.model}:generateContent?key=${provider.apiKey}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), aiConfig.requestTimeoutMs);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: input.systemPrompt
            ? { role: "system", parts: [{ text: input.systemPrompt }] }
            : undefined,
          contents: [
            { role: "user", parts: [{ text: input.userPrompt }] },
          ],
          generationConfig: {
            temperature: input.temperature ?? 0.2,
            maxOutputTokens: input.maxTokens ?? 1200,
            responseMimeType:
              input.responseFormat === "json" ? "application/json" : undefined,
          },
        }),
        signal: controller.signal,
      });

      const json = (await response.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
        usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
      };

      if (!response.ok) {
        throw new InternalError(`Gemini request failed (${response.status})`, json);
      }

      const content =
        json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
      let parsed: unknown = content;
      if (input.responseFormat === "json") {
        try {
          parsed = JSON.parse(content);
        } catch {
          parsed = { raw: content };
        }
      }

      return {
        provider: "gemini",
        model: provider.model,
        output: parsed,
        outputText: content,
        tokensInput: json.usageMetadata?.promptTokenCount ?? null,
        tokensOutput: json.usageMetadata?.candidatesTokenCount ?? null,
        costUsd: null,
        latencyMs: Date.now() - started,
        fallbackUsed: false,
      };
    } finally {
      clearTimeout(timer);
    }
  },
};