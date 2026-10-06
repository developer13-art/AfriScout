import { PageHeader } from "../../components/layout/PageHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { Loader } from "../../components/ui/Loader";
import { Bell } from "lucide-react";
import { useNotifications } from "../../hooks/useNotifications";
import { formatRelative } from "../../utils/formatDate";
import { SeoHead } from "../../components/common/SeoHead";

export function Notifications() {
  const notifications = useNotifications();

  return (
    <>
      <SeoHead title="Notifications" />
      <PageHeader
        title="Notifications"
        description="Matches, deadline alerts, updates, and system events."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => notifications.markAllRead.mutate()}
          >
            Mark all read
          </Button>
        }
      />

      {notifications.isLoading ? (
        <Loader fullPage label="Loading notifications" />
      ) : (notifications.data ?? []).length === 0 ? (
        <EmptyState
          icon={<Bell className="h-6 w-6" />}
          title="No notifications"
          description="Alerts will appear here as your opportunities evolve."
        />
      ) : (
        <div className="space-y-2">
          {(notifications.data ?? []).map((n) => (
            <Card key={n.id} padding="sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-900">{n.title}</p>
                  {n.body ? (
                    <p className="mt-0.5 text-sm text-neutral-600">{n.body}</p>
                  ) : null}
                  <p className="mt-1 text-[11px] uppercase tracking-wide text-neutral-400">
                    {formatRelative(n.createdAt)}
                  </p>
                </div>
                {!n.readAt ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => notifications.markRead.mutate(n.id)}
                  >
                    Mark read
                  </Button>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}