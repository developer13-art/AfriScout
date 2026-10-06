import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { matchingService } from "../services/matching.service";

export function useMatches(limit = 50) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["matches", limit],
    queryFn: () => matchingService.list(limit),
    refetchInterval: (query) =>
      query.state.data?.aiAnalysisPending ? 5000 : false,
  });
  const recompute = useMutation({
    mutationFn: () => matchingService.recompute(),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["matches"] }),
  });

  return { ...query, recompute };
}