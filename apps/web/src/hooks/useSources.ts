import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sourceService } from "../services/source.service";
import type { Source, SourceFilters } from "../types/source";

export function useSources(filters?: SourceFilters, page = 1, pageSize = 20) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["sources", filters, page, pageSize],
    queryFn: () => sourceService.list(filters, page, pageSize),
  });

  const create = useMutation({
    mutationFn: (source: Partial<Source>) => sourceService.create(source),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sources"] }),
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Source> }) =>
      sourceService.update(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sources"] }),
  });

  const activate = useMutation({
    mutationFn: (id: string) => sourceService.activate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sources"] }),
  });

  const deactivate = useMutation({
    mutationFn: (id: string) => sourceService.deactivate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sources"] }),
  });

  const test = useMutation({
    mutationFn: (id: string) => sourceService.test(id),
  });

  return { ...query, create, update, activate, deactivate, test };
}

export function useSource(id: string | undefined) {
  return useQuery({
    queryKey: ["source", id],
    queryFn: () => (id ? sourceService.get(id) : null),
    enabled: Boolean(id),
  });
}

export function useSourceAdapters() {
  return useQuery({
    queryKey: ["source-adapters"],
    queryFn: () => sourceService.adapters(),
  });
}