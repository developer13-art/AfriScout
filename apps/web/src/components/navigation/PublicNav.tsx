import { Link, NavLink } from "react-router-dom";
import { cn } from "../../utils/strings";
import { publicNavigation, publicMoreNavigation } from "../../config/navigation";

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
    <nav className="space-y-6">
      <div>
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
          Product
        </p>
        <ul className="space-y-0.5">
          {publicNavigation.map((item) => (
            <li key={item.to}>
              <NavLink
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
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
          More
        </p>
        <ul className="space-y-0.5">
          {publicMoreNavigation.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
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
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-neutral-200 pt-3">
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