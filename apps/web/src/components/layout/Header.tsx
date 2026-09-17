import { Link, useNavigate } from "react-router-dom";
import { Menu, ChevronDown } from "lucide-react";
import { Container } from "./Container";
import { AppLogo } from "../common/AppLogo";
import { Button } from "../ui/Button";
import { IconButton } from "../ui/IconButton";
import { Dropdown, DropdownItem } from "../ui/Dropdown";
import { useAuth } from "../../hooks/useAuth";
import { UserMenu } from "../navigation/UserMenu";
import { publicNavigation, publicMoreNavigation } from "../../config/navigation";

export interface HeaderProps {
  onOpenMobileNav?: () => void;
}

export function Header({ onOpenMobileNav }: HeaderProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

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
          {publicNavigation.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-sm font-medium text-neutral-700 transition-colors hover:text-primary-700"
            >
              {item.label}
            </Link>
          ))}

          <Dropdown
            align="left"
            trigger={
              <span className="inline-flex items-center gap-1 text-sm font-medium text-neutral-700 transition-colors hover:text-primary-700">
                More
                <ChevronDown aria-hidden className="h-3.5 w-3.5" />
              </span>
            }
          >
            {publicMoreNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <DropdownItem
                  key={item.to}
                  icon={<Icon className="h-4 w-4" />}
                  onClick={() => navigate(item.to)}
                >
                  {item.label}
                </DropdownItem>
              );
            })}
          </Dropdown>
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