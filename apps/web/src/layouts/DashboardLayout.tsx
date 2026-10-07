import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Menu, Search } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { Topbar } from "../components/layout/Topbar";
import { UserNav } from "../components/navigation/UserNav";
import { AppLogo } from "../components/common/AppLogo";
import { UserMenu } from "../components/navigation/UserMenu";
import { MobileNav } from "../components/navigation/MobileNav";
import { IconButton } from "../components/ui/IconButton";
import { useUiStore } from "../stores/uiStore";
import "../styles/community.css";

export function DashboardLayout() {
  const open = useUiStore((s) => s.mobileNavOpen);
  const setOpen = useUiStore((s) => s.setMobileNavOpen);
  const location = useLocation();
  const navigate = useNavigate();
  const [memberSearch, setMemberSearch] = useState("");
  const socialTheme = location.pathname.startsWith("/community") || location.pathname === "/profile";
  const submitMemberSearch = (event: FormEvent) => {
    event.preventDefault();
    const query = memberSearch.trim();
    navigate(query ? `/community/members?q=${encodeURIComponent(query)}` : "/community/members");
  };

  return (
    <div className={`scout-product-shell flex min-h-screen bg-neutral-50 ${socialTheme ? "scout-social-shell" : ""}`}>
      <div className="hidden lg:block">
        <Sidebar header={<AppLogo />} className="scout-product-sidebar">
          <UserNav />
        </Sidebar>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          center={socialTheme ? (
            <form onSubmit={submitMemberSearch} className="scout-global-search">
              <Search aria-hidden className="h-4 w-4 shrink-0" />
              <input
                value={memberSearch}
                onChange={(event) => setMemberSearch(event.target.value)}
                placeholder="Search opportunities, people, tools…"
                aria-label="Search Scout members"
              />
            </form>
          ) : undefined}
          left={
            <IconButton
              icon={<Menu className="h-4 w-4" />}
              label="Open navigation"
              tone="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setOpen(true)}
            />
          }
          right={<UserMenu />}
          className="scout-product-topbar"
        />
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