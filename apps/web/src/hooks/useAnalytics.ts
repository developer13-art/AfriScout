import { useQuery } from "@tanstack/react-query";
import { analyticsService } from "../services/analytics.service";

export function useUserAnalytics() {
  return useQuery({
    queryKey: ["analytics", "user"],
    queryFn: () => analyticsService.user(),
  });
}

export function useBusinessAnalytics() {
  return useQuery({
    queryKey: ["analytics", "business"],
    queryFn: () => analyticsService.business(),
  });
}

export function useAdminAnalytics() {
  return useQuery({
    queryKey: ["analytics", "admin"],
    queryFn: () => analyticsService.admin(),
  });
}

export function useOpportunityAnalytics() {
  return useQuery({
    queryKey: ["analytics", "opportunities"],
    queryFn: () => analyticsService.opportunities(),
  });
}