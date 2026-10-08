import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiKeyService } from "../services/apiKey.service";

export function useApiKeys() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["api-keys"],
    queryFn: () => apiKeyService.list(),
  });

  const create = useMutation({
    mutationFn: ({ name, scopes }: { name: string; scopes: string[] }) =>
      apiKeyService.create(name, scopes),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["api-keys"] }),
  });

  const revoke = useMutation({
    mutationFn: (id: string) => apiKeyService.revoke(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["api-keys"] }),
  });

  return { ...query, create, revoke };
}