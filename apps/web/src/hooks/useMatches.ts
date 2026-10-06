import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { matchingService } from "../services/matching.service";
import { useAuthStore } from "../stores/authStore";

export function useMatches(limit = 50, enabled = true) {
  const userId = useAuthStore((state) => state.user?.id);
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["matches", userId, limit],
    queryFn: () => matchingService.list(limit),
    enabled: Boolean(userId) && enabled,
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