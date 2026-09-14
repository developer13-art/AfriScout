import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import { Container } from "./Container";
import { AppLogo } from "../common/AppLogo";
import { Button } from "../ui/Button";
import { IconButton } from "../ui/IconButton";
import { useAuth } from "../../hooks/useAuth";
import { UserMenu } from "../navigation/UserMenu";

export interface HeaderProps {
  onOpenMobileNav?: () => void;
}

export function Header({ onOpenMobileNav }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <Container className="flex h-16 items-center gap-4">
        <div className="flex items-center gap-3">
          {onOpenMobileNav ? (
            <span className="lg:hidden">
              <IconButton
                icon={<Menu className="h-4 w-4" />}
                label="Open navigation"
                tone="ghost"
                size="sm"
                onClick={onOpenMobileNav}
              />
            </span>
          ) : null}
          <Link to="/" className="flex items-center" aria-label="AfriScout home">
            <AppLogo />
          </Link>
        </div>

        <nav className="hidden items-center gap-6 lg:flex">
          <Link to="/explore" className="text-sm font-medium text-neutral-700 hover:text-primary-700">
            Explore
          </Link>
          <Link to="/how-it-works" className="text-sm font-medium text-neutral-700 hover:text-primary-700">
            How It Works
          </Link>
          <Link to="/sources" className="text-sm font-medium text-neutral-700 hover:text-primary-700">
            Sources
          </Link>
          <Link to="/about" className="text-sm font-medium text-neutral-700 hover:text-primary-700">
            About
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <UserMenu />
          ) : (
            <>
              <Link to="/login" className="hidden sm:block">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">
                  Get started
                </Button>
              </Link>
            </>
          )}
        </div>
      </Container>
    </header>
  );
}