import { NavLink } from "react-router-dom";
import { cn } from "../../utils/strings";
import { userNavigation } from "../../config/navigation";
import { useNotificationStore } from "../../stores/notificationStore";

export function UserNav() {
  const unread = useNotificationStore((s) => s.unreadCount);

  return (
    <nav className="space-y-6">
      {userNavigation.map((section) => (
        <div key={section.id}>
          <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
            {section.label}
          </p>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const Icon = item.icon;
              const badgeValue =
                item.badgeKey === "unreadNotifications" ? unread : undefined;
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === "/dashboard"}
                    className={({ isActive }) =>
                      cn(
                        "group flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary-50 text-primary-700"
                          : "text-neutral-700 hover:bg-neutral-100",
                      )
                    }
                  >
                    <Icon aria-hidden className="h-4 w-4 shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {badgeValue && badgeValue > 0 ? (
                      <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary-600 px-1.5 text-[10px] font-semibold text-white">
                        {badgeValue > 99 ? "99+" : badgeValue}
                      </span>
                    ) : null}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}