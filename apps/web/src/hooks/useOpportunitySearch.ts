import { useQuery } from "@tanstack/react-query";
import { searchService } from "../services/search.service";
import type { OpportunityFilters } from "../types/opportunity";

export function useOpportunitySearch(
  query: string,
  filters?: OpportunityFilters,
  page = 1,
  pageSize = 20,
) {
  return useQuery({
    queryKey: ["search", query, filters, page, pageSize],
    queryFn: () => searchService.search(query, filters, page, pageSize),
    enabled: query.trim().length >= 2,
  });
}