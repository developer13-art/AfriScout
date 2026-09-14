import { useQuery } from "@tanstack/react-query";
import { opportunityService } from "../services/opportunity.service";

export function useOpportunity(slug: string | undefined) {
  return useQuery({
    queryKey: ["opportunity", slug],
    queryFn: () => (slug ? opportunityService.get(slug) : null),
    enabled: Boolean(slug),
  });
}