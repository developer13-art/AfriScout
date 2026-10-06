import type { ReactNode } from "react";
import { Card, CardHeader } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { Activity } from "lucide-react";

export interface ActivityItem {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  icon?: ReactNode;
}

export interface ActivityFeedProps {
  title?: string;
  items: ActivityItem[];
  emptyMessage?: string;
}

export function ActivityFeed({
  title = "Recent activity",
  items,
  emptyMessage = "No recent activity.",
}: ActivityFeedProps) {
  return (
    <Card>
      <CardHeader title={title} />
      {items.length === 0 ? (
        <EmptyState
          icon={<Activity className="h-5 w-5" />}
          title="Nothing here yet"
          description={emptyMessage}
        />
      ) : (
        <ul className="divide-y divide-neutral-100">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              {item.icon ? (
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-neutral-500" aria-hidden>
                  {item.icon}
                </span>
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-neutral-800">{item.title}</p>
                {item.description ? (
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {item.description}
                  </p>
                ) : null}
                <p className="mt-0.5 text-[11px] text-neutral-400">
                  {item.timestamp}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}