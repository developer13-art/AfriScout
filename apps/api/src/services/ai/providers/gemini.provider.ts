import type { AiProvider, AiWebSearchResult } from "../provider.interface";
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

  async searchWeb(queries: string[]): Promise<AiWebSearchResult[]> {
    const provider = aiConfig.providers.gemini;
    if (!provider.apiKey) throw new InternalError("Gemini key not configured");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), aiConfig.requestTimeoutMs);
    try {
      const response = await fetch(
        `${provider.baseUrl}/v1beta/models/${provider.model}:generateContent?key=${provider.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              role: "user",
              parts: [{
                text: `Use live Google Search grounding to find actual public opportunity publishers matching these searches. Never invent or guess URLs. Summarize only grounded results.\n${queries.map((query) => `- ${query}`).join("\n")}`,
              }],
            }],
            tools: [{ google_search: {} }],
            generationConfig: { maxOutputTokens: 5000 },
          }),
          signal: controller.signal,
        },
      );
      const json = await response.json() as unknown;
      if (!response.ok) {
        throw new InternalError(`Gemini Google Search grounding failed (${response.status})`, json);
      }
      return parseGeminiGroundingResponse(json, queries);
    } finally {
      clearTimeout(timer);
    }
  },
};

export function parseGeminiGroundingResponse(
  value: unknown,
  queries: string[],
): AiWebSearchResult[] {
  if (!isRecord(value) || !Array.isArray(value.candidates)) return [];
  const results: AiWebSearchResult[] = [];
  for (const candidate of value.candidates) {
    if (!isRecord(candidate) || !isRecord(candidate.groundingMetadata)) continue;
    const metadata = candidate.groundingMetadata;
    const searchQueries = Array.isArray(metadata.webSearchQueries)
      ? metadata.webSearchQueries.filter((query): query is string => typeof query === "string")
      : [];
    const query = searchQueries[0] ?? queries[0] ?? "";
    const text = isRecord(candidate.content) && Array.isArray(candidate.content.parts)
      ? candidate.content.parts.map((part) =>
          isRecord(part) && typeof part.text === "string" ? part.text : "",
        ).join("")
      : "";
    const snippets = new Map<number, string[]>();
    if (Array.isArray(metadata.groundingSupports)) {
      for (const support of metadata.groundingSupports) {
        if (!isRecord(support) || !isRecord(support.segment)) continue;
        const segment = support.segment;
        const snippet = typeof segment.text === "string"
          ? segment.text
          : typeof segment.startIndex === "number" && typeof segment.endIndex === "number"
            ? text.slice(segment.startIndex, segment.endIndex)
            : "";
        if (!Array.isArray(support.groundingChunkIndices)) continue;
        for (const index of support.groundingChunkIndices) {
          if (typeof index !== "number") continue;
          snippets.set(index, [...(snippets.get(index) ?? []), snippet]);
        }
      }
    }
    if (!Array.isArray(metadata.groundingChunks)) continue;
    metadata.groundingChunks.forEach((chunk, index) => {
      if (!isRecord(chunk) || !isRecord(chunk.web) || typeof chunk.web.uri !== "string") return;
      results.push({
        title: typeof chunk.web.title === "string" ? chunk.web.title : chunk.web.uri,
        url: chunk.web.uri,
        description: (snippets.get(index) ?? []).join(" ").slice(0, 1000),
        query,
      });
    });
  }
  const byUrl = new Map<string, AiWebSearchResult>();
  for (const result of results) {
    try {
      const url = new URL(result.url);
      if (!["http:", "https:"].includes(url.protocol) || !url.hostname) continue;
      if (!byUrl.has(url.toString())) byUrl.set(url.toString(), result);
    } catch {
      continue;
    }
  }
  return [...byUrl.values()].slice(0, 80);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}