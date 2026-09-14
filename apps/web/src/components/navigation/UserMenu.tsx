import { Link, useNavigate } from "react-router-dom";
import { LogOut, Settings, User, LayoutDashboard } from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { Dropdown, DropdownItem, DropdownDivider } from "../ui/Dropdown";
import { useAuth } from "../../hooks/useAuth";

export function UserMenu() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <Dropdown
      align="right"
      trigger={
        <span className="flex items-center gap-2 rounded-full ring-1 ring-neutral-200 hover:ring-neutral-300 pr-2">
          <Avatar name={user.fullName} src={user.avatarUrl} size="sm" />
          <span className="hidden text-sm font-medium text-neutral-800 sm:inline">
            {user.fullName.split(" ")[0]}
          </span>
        </span>
      }
    >
      <div className="px-2.5 py-2">
        <p className="text-sm font-medium text-neutral-900 truncate">{user.fullName}</p>
        <p className="text-xs text-neutral-500 truncate">{user.email}</p>
      </div>
      <DropdownDivider />
      <DropdownItem
        icon={<LayoutDashboard className="h-4 w-4" />}
        onClick={() => navigate("/dashboard")}
      >
        Dashboard
      </DropdownItem>
      <DropdownItem
        icon={<User className="h-4 w-4" />}
        onClick={() => navigate("/profile")}
      >
        Profile
      </DropdownItem>
      <DropdownItem
        icon={<Settings className="h-4 w-4" />}
        onClick={() => navigate("/settings")}
      >
        Settings
      </DropdownItem>
      <DropdownDivider />
      <DropdownItem
        icon={<LogOut className="h-4 w-4" />}
        danger
        onClick={async () => {
          await signOut();
          navigate("/");
        }}
      >
        Sign out
      </DropdownItem>
    </Dropdown>
  );
}

export function UserMenuLink() {
  return (
    <Link
      to="/dashboard"
      className="text-sm font-medium text-neutral-700 hover:text-primary-700"
    >
      Dashboard
    </Link>
  );
}