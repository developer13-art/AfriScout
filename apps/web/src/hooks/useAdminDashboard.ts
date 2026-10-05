import { useQuery } from "@tanstack/react-query";
import { adminDashboardService } from "../services/adminDashboard.service";

export function useAdminDashboard() {
  return useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => adminDashboardService.get(),
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
  });
}