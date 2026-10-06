import type { ReactNode } from "react";
import type { UserRole } from "../../types/user";
import { useRole } from "../../hooks/useRole";
import { NotFoundState } from "./NotFoundState";

export interface RoleGuardProps {
  roles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({ roles, children, fallback }: RoleGuardProps) {
  const { role } = useRole();
  const allowed = role && roles.includes(role);

  if (!allowed) {
    return (
      fallback ?? (
        <NotFoundState
          title="Access restricted"
          description="You do not have permission to view this section."
        />
      )
    );
  }

  return <>{children}</>;
}