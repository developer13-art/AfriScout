import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/layout/Sidebar";
import { Topbar } from "../components/layout/Topbar";
import { UserNav } from "../components/navigation/UserNav";
import { AppLogo } from "../components/common/AppLogo";
import { UserMenu } from "../components/navigation/UserMenu";
import { MobileNav } from "../components/navigation/MobileNav";
import { useUiStore } from "../stores/uiStore";

export function DashboardLayout() {
  const open = useUiStore((s) => s.mobileNavOpen);
  const setOpen = useUiStore((s) => s.setMobileNavOpen);

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <div className="hidden lg:block">
        <Sidebar header={<AppLogo />}>
          <UserNav />
        </Sidebar>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar right={<UserMenu />} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
      <MobileNav open={open} onClose={() => setOpen(false)}>
        <UserNav />
      </MobileNav>
    </div>
  );
}