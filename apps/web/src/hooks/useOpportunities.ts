import { useQuery } from "@tanstack/react-query";
import { opportunityService } from "../services/opportunity.service";
import type { OpportunityFilters } from "../types/opportunity";

export function useOpportunities(filters?: OpportunityFilters, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ["opportunities", filters, page, pageSize],
    queryFn: () => opportunityService.list(filters, page, pageSize),
  });
}