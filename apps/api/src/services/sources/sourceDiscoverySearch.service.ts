import { aiConfig } from "../../config/ai";
import { InternalError } from "../../utils/errors";
import { configuredChain } from "../ai/provider.registry";
import type { AiWebSearchResult } from "../ai/provider.interface";
import { normalizedCandidateUrl, getHost } from "./sourceDiscoveryAnalysis.service";

export async function discoverWebSearchResults(queries: string[]): Promise<AiWebSearchResult[]> {
  const providers = aiConfig.enabled
    ? configuredChain().filter((provider) => typeof provider.searchWeb === "function")
    : [];
  if (providers.length === 0) {
    throw new InternalError(
      "Source discovery requires an enabled OpenAI or Gemini provider with native web search. Configure an API key and a web-search-capable model, then retry.",
    );
  }

  const failures: string[] = [];
  for (const provider of providers) {
    try {
      const results = await provider.searchWeb!(queries);
      const byHost = new Map<string, AiWebSearchResult>();
      for (const result of results) {
        const url = normalizedCandidateUrl(result.url);
        const host = url ? getHost(url) : null;
        if (!url || !host || byHost.has(host)) continue;
        byHost.set(host, { ...result, url });
        if (byHost.size >= 80) break;
      }
      if (byHost.size > 0) return [...byHost.values()];
      failures.push(`${provider.name} returned no traceable web-search results`);
    } catch (error) {
      failures.push(`${provider.name}: ${error instanceof Error ? error.message : "web search failed"}`);
    }
  }

  throw new InternalError(
    `Native web search did not produce any traceable source results. ${failures.join("; ")}`,
  );
}
