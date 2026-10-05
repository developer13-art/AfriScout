import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pipelineService } from "../services/pipeline.service";
import type { PipelineStage } from "../types/pipeline";

export function usePipeline(pipelineId?: string) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["pipeline", pipelineId],
    queryFn: () => pipelineService.listItems(pipelineId),
  });

  const add = useMutation({
    mutationFn: (opportunityId: string) =>
      pipelineService.add(opportunityId, pipelineId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pipeline"] }),
  });

  const move = useMutation({
    mutationFn: ({
      itemId,
      stage,
      submissionReference,
    }: {
      itemId: string;
      stage: PipelineStage;
      submissionReference?: string;
    }) => pipelineService.move(itemId, stage, submissionReference),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pipeline"] }),
  });

  const remove = useMutation({
    mutationFn: (itemId: string) => pipelineService.remove(itemId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pipeline"] }),
  });

  return { ...query, add, move, remove };
}