import { Clock } from "lucide-react";
import { Badge, type BadgeTone } from "../ui/Badge";
import { deadlineLabel, deadlineUrgency } from "../../utils/deadline";

export interface DeadlineBadgeProps {
  deadline: string;
}

const toneByUrgency: Record<string, BadgeTone> = {
  expired: "neutral",
  today: "danger",
  urgent: "danger",
  soon: "warning",
  later: "neutral",
  unknown: "neutral",
};

export function DeadlineBadge({ deadline }: DeadlineBadgeProps) {
  const urgency = deadlineUrgency(deadline);
  const label = deadlineLabel(deadline);
  const tone = toneByUrgency[urgency] ?? "neutral";

  return (
    <Badge tone={tone} icon={<Clock className="h-3 w-3" />}>
      {label || "No deadline"}
    </Badge>
  );
}