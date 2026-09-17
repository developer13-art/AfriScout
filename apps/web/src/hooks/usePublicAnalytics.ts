import { useQuery } from "@tanstack/react-query";
import { publicAnalyticsService } from "../services/publicAnalytics.service";

export function usePublicTotals() {
  return useQuery({
    queryKey: ["public", "analytics", "totals"],
    queryFn: () => publicAnalyticsService.totals(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function usePublicCountryBreakdown() {
  return useQuery({
    queryKey: ["public", "analytics", "countries"],
    queryFn: () => publicAnalyticsService.countries(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}