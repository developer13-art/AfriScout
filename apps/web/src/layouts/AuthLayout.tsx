import { Outlet } from "react-router-dom";
import { Link } from "react-router-dom";
import { AppLogo } from "../components/common/AppLogo";
import { appConfig } from "../config/app";

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" aria-label="AfriScout home">
            <AppLogo />
          </Link>
          <p className="hidden text-xs text-neutral-500 sm:block">
            {appConfig.shortDescription}
          </p>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>
      <footer className="border-t border-neutral-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 text-xs text-neutral-500 sm:px-6 lg:px-8">
          &copy; {new Date().getFullYear()} {appConfig.name}
        </div>
      </footer>
    </div>
  );
}