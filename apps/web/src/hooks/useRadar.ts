import { useQuery } from "@tanstack/react-query";
import { radarService } from "../services/radar.service";

export function useRadar() {
  return useQuery({
    queryKey: ["radar"],
    queryFn: () => radarService.get(),
  });
}