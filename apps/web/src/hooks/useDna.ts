import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dnaService } from "../services/dna.service";
import type { DnaDraft } from "../types/dna";

export function useDna() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["dna"],
    queryFn: () => dnaService.getActive(),
  });

  const save = useMutation({
    mutationFn: (draft: DnaDraft | Partial<DnaDraft>) =>
      draft && "industries" in draft && Array.isArray((draft as DnaDraft).industries)
        ? dnaService.create(draft as DnaDraft)
        : dnaService.update(draft as Partial<DnaDraft>),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dna"] }),
  });

  const archive = useMutation({
    mutationFn: () => dnaService.archive(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dna"] }),
  });

  return { ...query, save, archive };
}