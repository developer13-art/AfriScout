import { Link, useLocation } from "react-router-dom";
import { Users, Rss, MessagesSquare, Settings2, Compass } from "lucide-react";

const links = [
  { label: "Feed", to: "/community", icon: Rss, end: true },
  { label: "Members", to: "/community/members", icon: Users },
  { label: "Groups", to: "/community/groups", icon: Compass },
  { label: "Discussions", to: "/community?tab=discussions", icon: MessagesSquare },
  { label: "Settings", to: "/community/settings", icon: Settings2 },
];

export function CommunitySubnav() {
  const location = useLocation();
  const selectedTab = new URLSearchParams(location.search).get("tab");
  const isActive = (to: string, end?: boolean) => {
    if (to === "/community?tab=discussions") {
      return location.pathname === "/community" && selectedTab === "discussions";
    }
    if (to === "/community") {
      return location.pathname === "/community" && selectedTab !== "discussions";
    }
    return end ? location.pathname === to : location.pathname.startsWith(to);
  };

  return (
    <nav aria-label="Community navigation" className="scout-community-subnav">
      {links.map(({ label, to, icon: Icon, end }) => (
        <Link
          key={label}
          to={to}
          className={`scout-community-subnav-link${isActive(to, end) ? " is-active" : ""}`}
        >
          <Icon aria-hidden className="h-4 w-4" />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
