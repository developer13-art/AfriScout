import type { AiProvider, AiWebSearchResult } from "../provider.interface";
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

  async searchWeb(queries: string[]): Promise<AiWebSearchResult[]> {
    const provider = aiConfig.providers.openai;
    if (!provider.apiKey) throw new InternalError("OpenAI key not configured");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), aiConfig.requestTimeoutMs);
    try {
      const response = await fetch(`${provider.baseUrl}/responses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${provider.apiKey}`,
        },
        body: JSON.stringify({
          model: provider.model,
          instructions:
            "Use live web search to find actual public websites that publish opportunities matching the requested searches. Cite each result using web citations. Never invent or guess URLs. Return concise descriptions grounded in the search results.",
          input: `Search for relevant opportunity publishers using these queries:\n${queries.map((query) => `- ${query}`).join("\n")}`,
          tools: [{ type: "web_search" }],
          include: ["web_search_call.action.sources"],
          max_output_tokens: 5000,
        }),
        signal: controller.signal,
      });
      const json = await response.json() as unknown;
      if (!response.ok) {
        throw new InternalError(`OpenAI live web search failed (${response.status})`, json);
      }
      return parseOpenAiWebSearchResponse(json, queries);
    } finally {
      clearTimeout(timer);
    }
  },
};

export function parseOpenAiWebSearchResponse(
  value: unknown,
  queries: string[],
): AiWebSearchResult[] {
  if (!isRecord(value) || !Array.isArray(value.output)) return [];
  const results: AiWebSearchResult[] = [];
  for (const item of value.output) {
    if (!isRecord(item)) continue;
    const action = isRecord(item.action) ? item.action : {};
    const query = typeof action.query === "string" ? action.query : queries[0] ?? "";
    if (Array.isArray(action.sources)) {
      for (const source of action.sources) {
        if (isRecord(source) && typeof source.url === "string") {
          results.push({
            title: typeof source.title === "string" ? source.title : source.url,
            url: source.url,
            description: "",
            query,
          });
        }
      }
    }
    if (item.type !== "message" || !Array.isArray(item.content)) continue;
    for (const part of item.content) {
      if (!isRecord(part) || typeof part.text !== "string" || !Array.isArray(part.annotations)) continue;
      for (const annotation of part.annotations) {
        if (!isRecord(annotation) || annotation.type !== "url_citation" || typeof annotation.url !== "string") continue;
        const title = typeof annotation.title === "string" ? annotation.title : annotation.url;
        const description = part.text.slice(
          Math.max(0, (typeof annotation.start_index === "number" ? annotation.start_index : 0) - 240),
          Math.min(part.text.length, (typeof annotation.end_index === "number" ? annotation.end_index : part.text.length) + 240),
        ).trim();
        results.push({ title, url: annotation.url, description, query });
      }
    }
  }
  return uniqueWebResults(results);
}

function uniqueWebResults(results: AiWebSearchResult[]): AiWebSearchResult[] {
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