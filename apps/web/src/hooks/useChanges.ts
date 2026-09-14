import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { changeService } from "../services/change.service";

export function useChanges(page = 1, pageSize = 50) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["changes", page, pageSize],
    queryFn: () => changeService.list(page, pageSize),
  });

  const markNotified = useMutation({
    mutationFn: (id: string) => changeService.markNotified(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["changes"] }),
  });

  return { ...query, markNotified };
}