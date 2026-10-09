import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../config/ai", () => ({ aiConfig: { enabled: true } }));
vi.mock("../ai/provider.registry", () => ({ configuredChain: vi.fn() }));

import { configuredChain } from "../ai/provider.registry";
import { parseGeminiGroundingResponse } from "../ai/providers/gemini.provider";
import { parseOpenAiWebSearchResponse } from "../ai/providers/openai.provider";
import type { AiProvider } from "../ai/provider.interface";
import { discoverWebSearchResults } from "./sourceDiscoverySearch.service";

const configuredChainMock = vi.mocked(configuredChain);

function provider(
  name: AiProvider["name"],
  searchWeb?: AiProvider["searchWeb"],
): AiProvider {
  return {
    name,
    isConfigured: () => true,
    complete: vi.fn(),
    searchWeb,
  };
}

describe("native source discovery web search", () => {
  beforeEach(() => configuredChainMock.mockReset());

  it("extracts only OpenAI web-search sources and explicit URL citations", () => {
    const results = parseOpenAiWebSearchResponse({
      output: [
        {
          type: "web_search_call",
          action: {
            query: "Nigeria grants",
            sources: [{ title: "Grant portal", url: "https://grants.example.org" }],
          },
        },
        {
          type: "message",
          content: [{
            type: "output_text",
            text: "A grounded result. A made-up URL https://invented.invalid",
            annotations: [{
              type: "url_citation",
              title: "Cited source",
              url: "https://cited.example.org/opportunities",
              start_index: 0,
              end_index: 22,
            }],
          }],
        },
      ],
    }, ["Nigeria grants"]);

    expect(results.map((result) => result.url)).toEqual([
      "https://grants.example.org",
      "https://cited.example.org/opportunities",
    ]);
    expect(results[0].query).toBe("Nigeria grants");
    expect(parseOpenAiWebSearchResponse({
      output: [{ type: "message", content: [{ text: "https://invented.invalid" }] }],
    }, ["query"])).toEqual([]);
  });

  it("uses Gemini grounding chunks and their grounded text segments", () => {
    const results = parseGeminiGroundingResponse({
      candidates: [{
        content: { parts: [{ text: "Verified through grounding." }] },
        groundingMetadata: {
          webSearchQueries: ["Kenya scholarships"],
          groundingChunks: [
            { web: { title: "Scholarship portal", uri: "https://scholarships.example.ke" } },
          ],
          groundingSupports: [{
            segment: { text: "Scholarship applications are listed here." },
            groundingChunkIndices: [0],
          }],
        },
      }],
    }, ["Kenya scholarships"]);

    expect(results).toEqual([{
      title: "Scholarship portal",
      url: "https://scholarships.example.ke",
      description: "Scholarship applications are listed here.",
      query: "Kenya scholarships",
    }]);
    expect(parseGeminiGroundingResponse({
      candidates: [{ content: { parts: [{ text: "An ungrounded answer" }] } }],
    }, ["query"])).toEqual([]);
  });

  it("selects configured native-search providers in chain order and falls through on failure", async () => {
    const unavailableSearch = provider("openai", vi.fn().mockRejectedValue(new Error("model has no web search")));
    const groundedSearch = provider("gemini", vi.fn().mockResolvedValue([{
      title: "Portal",
      url: "https://www.portal.example/jobs?utm_source=search",
      description: "Grounded result",
      query: "jobs Africa",
    }]));
    configuredChainMock.mockReturnValue([
      provider("openrouter"),
      unavailableSearch,
      groundedSearch,
    ]);

    await expect(discoverWebSearchResults(["jobs Africa"])).resolves.toEqual([{
      title: "Portal",
      url: "https://portal.example/jobs",
      description: "Grounded result",
      query: "jobs Africa",
    }]);
    expect(unavailableSearch.searchWeb).toHaveBeenCalledOnce();
    expect(groundedSearch.searchWeb).toHaveBeenCalledOnce();
  });

  it("fails clearly when grounded search is unavailable or returns no traceable results", async () => {
    configuredChainMock.mockReturnValue([provider("openrouter")]);
    await expect(discoverWebSearchResults(["grants Africa"])).rejects.toThrow(
      /requires an enabled OpenAI or Gemini provider with native web search/i,
    );

    configuredChainMock.mockReturnValue([
      provider("openai", vi.fn().mockResolvedValue([])),
    ]);
    await expect(discoverWebSearchResults(["grants Africa"])).rejects.toThrow(
      /did not produce any traceable source results.*no traceable web-search results/i,
    );
  });

  it("reports native provider errors instead of substituting fabricated candidates", async () => {
    configuredChainMock.mockReturnValue([
      provider("openai", vi.fn().mockRejectedValue(new Error("HTTP 400: web_search unsupported"))),
    ]);
    await expect(discoverWebSearchResults(["grants Africa"])).rejects.toThrow(
      /openai: HTTP 400: web_search unsupported/i,
    );
  });
});
