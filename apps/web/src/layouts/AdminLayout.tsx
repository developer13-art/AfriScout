import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import { Sidebar } from "../components/layout/Sidebar";
import { Topbar } from "../components/layout/Topbar";
import { AdminNav } from "../components/navigation/AdminNav";
import { AppLogo } from "../components/common/AppLogo";
import { UserMenu } from "../components/navigation/UserMenu";
import { MobileNav } from "../components/navigation/MobileNav";
import { IconButton } from "../components/ui/IconButton";
import { Badge } from "../components/ui/Badge";
import { useUiStore } from "../stores/uiStore";

export function AdminLayout() {
  const open = useUiStore((s) => s.mobileNavOpen);
  const setOpen = useUiStore((s) => s.setMobileNavOpen);

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <div className="hidden lg:block">
        <Sidebar
          header={
            <div className="flex items-center gap-2">
              <AppLogo withText={false} />
              <div>
                <p className="text-sm font-semibold text-neutral-900">
                  AfriScout Admin
                </p>
                <p className="text-[11px] text-neutral-500">
                  Operations console
                </p>
              </div>
            </div>
          }
        >
          <AdminNav />
        </Sidebar>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          left={
            <>
              <IconButton
                icon={<Menu className="h-4 w-4" />}
                label="Open navigation"
                tone="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setOpen(true)}
              />
              <Badge tone="primary" size="sm">
                Admin
              </Badge>
            </>
          }
          right={<UserMenu />}
        />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
      <MobileNav open={open} onClose={() => setOpen(false)}>
        <AdminNav />
      </MobileNav>
    </div>
  );
}