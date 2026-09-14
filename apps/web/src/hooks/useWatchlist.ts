import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { watchlistService } from "../services/watchlist.service";

export function useWatchlist() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["watchlist"],
    queryFn: () => watchlistService.list(),
  });

  const add = useMutation({
    mutationFn: (opportunityId: string) => watchlistService.add(opportunityId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["watchlist"] }),
  });

  const remove = useMutation({
    mutationFn: (opportunityId: string) => watchlistService.remove(opportunityId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["watchlist"] }),
  });

  const update = useMutation({
    mutationFn: ({
      opportunityId,
      patch,
    }: {
      opportunityId: string;
      patch: { notifyDeadline?: boolean; notifyChanges?: boolean };
    }) => watchlistService.update(opportunityId, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["watchlist"] }),
  });

  return { ...query, add, remove, update };
}