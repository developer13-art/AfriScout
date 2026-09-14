import { Link, NavLink } from "react-router-dom";
import { cn } from "../../utils/strings";
import { publicNavigation } from "../../config/navigation";

export function PublicNav() {
  return (
    <nav className="hidden items-center gap-6 lg:flex">
      {publicNavigation.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          className={({ isActive }) =>
            cn(
              "text-sm font-medium transition-colors",
              isActive ? "text-primary-700" : "text-neutral-700 hover:text-primary-700",
            )
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

export function PublicNavMobile() {
  return (
    <nav className="space-y-1">
      {publicNavigation.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          className={({ isActive }) =>
            cn(
              "block rounded-md px-3 py-2 text-sm font-medium",
              isActive
                ? "bg-primary-50 text-primary-700"
                : "text-neutral-700 hover:bg-neutral-100",
            )
          }
        >
          {item.label}
        </NavLink>
      ))}
      <div className="pt-2">
        <Link
          to="/login"
          className="block rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
        >
          Sign in
        </Link>
        <Link
          to="/register"
          className="mt-1 block rounded-md bg-primary-600 px-3 py-2 text-center text-sm font-medium text-white hover:bg-primary-700"
        >
          Get started
        </Link>
      </div>
    </nav>
  );
}