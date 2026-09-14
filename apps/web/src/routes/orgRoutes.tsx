import type { RouteObject } from "react-router-dom";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { RouteGuard } from "../components/common/RouteGuard";
import {
  OrganizationProfile,
  OrganizationTeam,
  OrganizationSettings,
  OrganizationOpportunities,
} from "../pages";

export const orgRoutes: RouteObject[] = [
  {
    element: (
      <RouteGuard>
        <DashboardLayout />
      </RouteGuard>
    ),
    children: [
      { path: "/org/profile", element: <OrganizationProfile /> },
      { path: "/org/team", element: <OrganizationTeam /> },
      { path: "/org/settings", element: <OrganizationSettings /> },
      { path: "/org/opportunities", element: <OrganizationOpportunities /> },
    ],
  },
];