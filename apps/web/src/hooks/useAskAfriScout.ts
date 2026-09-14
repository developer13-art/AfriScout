import { useMutation } from "@tanstack/react-query";
import { aiService } from "../services/ai.service";

export function useAskAfriScout() {
  const intent = useMutation({
    mutationFn: (query: string) => aiService.ask(query),
  });

  const summary = useMutation({
    mutationFn: (opportunityId: string) => aiService.summary(opportunityId),
  });

  const analyst = useMutation({
    mutationFn: (opportunityId: string) => aiService.analyst(opportunityId),
  });

  return { intent, summary, analyst };
}