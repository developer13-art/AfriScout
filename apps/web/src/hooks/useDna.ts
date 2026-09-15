import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dnaService } from "../services/dna.service";
import type { DnaDraft } from "../types/dna";

export function useDna() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["dna"],
    queryFn: () => dnaService.getActive(),
  });

  // Whether to call create or update depends on whether an active DNA
  // profile already exists on the server, not on the shape of the draft.
  const save = useMutation({
    mutationFn: (draft: DnaDraft | Partial<DnaDraft>) =>
      query.data
        ? dnaService.update(draft as Partial<DnaDraft>)
        : dnaService.create(draft as DnaDraft),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dna"] }),
  });

  const archive = useMutation({
    mutationFn: () => dnaService.archive(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dna"] }),
  });

  return { ...query, save, archive };
}