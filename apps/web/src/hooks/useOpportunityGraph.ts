import { useQuery } from "@tanstack/react-query";
import { graphService } from "../services/graph.service";

export function useOpportunityGraph() {
  return useQuery({
    queryKey: ["opportunity-graph"],
    queryFn: graphService.opportunityGraph,
    staleTime: 60_000,
  });
}
