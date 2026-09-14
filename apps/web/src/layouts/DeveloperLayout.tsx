import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/layout/Sidebar";
import { Topbar } from "../components/layout/Topbar";
import { AppLogo } from "../components/common/AppLogo";
import { UserMenu } from "../components/navigation/UserMenu";
import { developerNavigation } from "../config/navigation";
import { NavLink } from "react-router-dom";
import { cn } from "../utils/strings";

function DeveloperNav() {
  return (
    <nav className="space-y-6">
      {developerNavigation.map((section) => (
        <div key={section.id}>
          <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
            {section.label}
          </p>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === "/developer"}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium",
                        isActive
                          ? "bg-primary-50 text-primary-700"
                          : "text-neutral-700 hover:bg-neutral-100",
                      )
                    }
                  >
                    <Icon aria-hidden className="h-4 w-4 shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
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

export function DeveloperLayout() {
  return (
    <div className="flex min-h-screen bg-neutral-50">
      <div className="hidden lg:block">
        <Sidebar header={<AppLogo />}>
          <DeveloperNav />
        </Sidebar>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar right={<UserMenu />} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}