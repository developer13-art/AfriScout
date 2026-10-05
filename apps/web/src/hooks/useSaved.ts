import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { savedService } from "../services/saved.service";

export function useSaved() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["saved"],
    queryFn: () => savedService.list(),
  });

  const add = useMutation({
    mutationFn: (opportunityId: string) => savedService.add(opportunityId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved"] }),
  });

  const remove = useMutation({
    mutationFn: (opportunityId: string) => savedService.remove(opportunityId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved"] }),
  });

  return { ...query, add, remove };
}