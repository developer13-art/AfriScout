import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { actorRunService } from "../services/actorRun.service";

export function useActorRuns(
  filters?: Record<string, unknown>,
  page = 1,
  pageSize = 20,
) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["actor-runs", filters, page, pageSize],
    queryFn: () => actorRunService.list(filters, page, pageSize),
  });

  const trigger = useMutation({
    mutationFn: (sourceId: string) => actorRunService.trigger(sourceId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["actor-runs"] }),
  });

  const abort = useMutation({
    mutationFn: (id: string) => actorRunService.abort(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["actor-runs"] }),
  });

  return { ...query, trigger, abort };
}

export function useActorRun(id: string | undefined) {
  return useQuery({
    queryKey: ["actor-run", id],
    queryFn: () => (id ? actorRunService.get(id) : null),
    enabled: Boolean(id),
  });
}