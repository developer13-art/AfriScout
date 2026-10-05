import { useQuery } from "@tanstack/react-query";
import { matchingService } from "../services/matching.service";

export function useMatches(limit = 50) {
  return useQuery({
    queryKey: ["matches", limit],
    queryFn: () => matchingService.list(limit),
  });
}