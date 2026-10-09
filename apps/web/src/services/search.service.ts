import { http } from "./http";
import type { OpportunityFilters, OpportunitySearchResult } from "../types/opportunity";
import type { AskAfriScoutIntent } from "../types/ai";

export const searchService = {
  search: (query: string, filters?: OpportunityFilters, page = 1, pageSize = 20) =>
    http<OpportunitySearchResult>("/search", {
      query: { q: query, ...filters, page, pageSize },
      method: "POST",
      body: JSON.stringify({ q: query, filters, page, pageSize }),
    }),

  intent: (query: string) =>
    http<AskAfriScoutIntent>("/search/intent", {
      method: "POST",
      body: JSON.stringify({ q: query }),
    }),
};