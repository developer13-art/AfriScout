import { Badge, type BadgeTone } from "../ui/Badge";
import type { SourceHealth } from "../../types/source";

const tone: Record<SourceHealth, BadgeTone> = {
  HEALTHY: "success",
  WARNING: "warning",
  FAILED: "danger",
  INACTIVE: "neutral",
  UNKNOWN: "neutral",
};

const label: Record<SourceHealth, string> = {
  HEALTHY: "Healthy",
  WARNING: "Warning",
  FAILED: "Failed",
  INACTIVE: "Inactive",
  UNKNOWN: "Unknown",
};

export function SourceHealthBadge({ health }: { health: SourceHealth }) {
  return <Badge tone={tone[health]}>{label[health]}</Badge>;
}