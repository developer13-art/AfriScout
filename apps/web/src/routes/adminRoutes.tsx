import type { RouteObject } from "react-router-dom";
import { AdminLayout } from "../layouts/AdminLayout";
import { RouteGuard } from "../components/common/RouteGuard";
import { RoleGuard } from "../components/common/RoleGuard";
import {
  AdminDashboard,
  AdminSources,
  AdminSourceDetails,
  AdminSourceNew,
  AdminSourceSuggested,
  AdminActorRuns,
  AdminActorRunDetails,
  AdminOpportunities,
  AdminOpportunityDetail,
  AdminOrganizations,
  AdminDuplicates,
  AdminChanges,
  AdminUsers,
  AdminUserDetails,
  AdminDataQuality,
  AdminAiMonitoring,
  AdminSystemHealth,
  AdminAuditLogs,
  AdminApiKeys,
  AdminWebhooks,
  AdminNotifications,
  AdminSettings,
  AdminRoles,
} from "../pages";

export const adminRoutes: RouteObject[] = [
  {
    element: (
      <RouteGuard>
        <RoleGuard roles={["SUPER_ADMIN", "DATA_ADMIN"]}>
          <AdminLayout />
        </RoleGuard>
      </RouteGuard>
    ),
    children: [
      { path: "/admin", element: <AdminDashboard /> },
      { path: "/admin/sources", element: <AdminSources /> },
      { path: "/admin/sources/new", element: <AdminSourceNew /> },
      { path: "/admin/sources/suggested", element: <AdminSourceSuggested /> },
      { path: "/admin/sources/:id", element: <AdminSourceDetails /> },
      { path: "/admin/actor-runs", element: <AdminActorRuns /> },
      { path: "/admin/actor-runs/:id", element: <AdminActorRunDetails /> },
      { path: "/admin/opportunities", element: <AdminOpportunities /> },
      { path: "/admin/opportunities/:id", element: <AdminOpportunityDetail /> },
      { path: "/admin/organizations", element: <AdminOrganizations /> },
      { path: "/admin/duplicates", element: <AdminDuplicates /> },
      { path: "/admin/changes", element: <AdminChanges /> },
      { path: "/admin/users", element: <AdminUsers /> },
      { path: "/admin/users/:id", element: <AdminUserDetails /> },
      { path: "/admin/data-quality", element: <AdminDataQuality /> },
      { path: "/admin/ai-monitoring", element: <AdminAiMonitoring /> },
      { path: "/admin/system-health", element: <AdminSystemHealth /> },
      { path: "/admin/audit-logs", element: <AdminAuditLogs /> },
      { path: "/admin/api-keys", element: <AdminApiKeys /> },
      { path: "/admin/webhooks", element: <AdminWebhooks /> },
      { path: "/admin/notifications", element: <AdminNotifications /> },
      { path: "/admin/roles", element: <AdminRoles /> },
      { path: "/admin/settings", element: <AdminSettings /> },
    ],
  },
];