import { Outlet } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { useUiStore } from "../stores/uiStore";
import { MobileNav } from "../components/navigation/MobileNav";
import { PublicNavMobile } from "../components/navigation/PublicNav";

export function PublicLayout() {
  const open = useUiStore((s) => s.mobileNavOpen);
  const setOpen = useUiStore((s) => s.setMobileNavOpen);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header onOpenMobileNav={() => setOpen(true)} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <MobileNav open={open} onClose={() => setOpen(false)}>
        <PublicNavMobile />
      </MobileNav>
    </div>
  );
}