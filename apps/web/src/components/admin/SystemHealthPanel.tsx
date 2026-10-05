import { Card, CardHeader } from "../ui/Card";
import { Badge } from "../ui/Badge";

export interface SystemHealthItem {
  key: string;
  label: string;
  status: "ok" | "degraded" | "down" | "unknown";
  detail?: string;
}

export interface SystemHealthPanelProps {
  items: SystemHealthItem[];
}

const toneByStatus = {
  ok: "success",
  degraded: "warning",
  down: "danger",
  unknown: "neutral",
} as const;

const labelByStatus = {
  ok: "Operational",
  degraded: "Degraded",
  down: "Down",
  unknown: "Unknown",
} as const;

export function SystemHealthPanel({ items }: SystemHealthPanelProps) {
  return (
    <Card>
      <CardHeader title="System health" />
      <ul className="divide-y divide-neutral-100">
        {items.map((item) => (
          <li key={item.key} className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-neutral-800">{item.label}</p>
              {item.detail ? (
                <p className="text-xs text-neutral-500">{item.detail}</p>
              ) : null}
            </div>
            <Badge tone={toneByStatus[item.status]}>
              {labelByStatus[item.status]}
            </Badge>
          </li>
        ))}
      </ul>
    </Card>
  );
}