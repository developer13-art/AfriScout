import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { duplicateService } from "../services/duplicate.service";

export function useDuplicates() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["duplicates"],
    queryFn: () => duplicateService.list(),
  });

  const merge = useMutation({
    mutationFn: (id: string) => duplicateService.merge(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["duplicates"] }),
  });

  const separate = useMutation({
    mutationFn: (id: string) => duplicateService.separate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["duplicates"] }),
  });

  const ignore = useMutation({
    mutationFn: (id: string) => duplicateService.ignore(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["duplicates"] }),
  });

  return { ...query, merge, separate, ignore };
}