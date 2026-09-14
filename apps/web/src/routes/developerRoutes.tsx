import type { RouteObject } from "react-router-dom";
import { DeveloperLayout } from "../layouts/DeveloperLayout";
import { RouteGuard } from "../components/common/RouteGuard";
import {
  ApiPortal,
  ApiKeysPage,
  ApiDocs,
  ApiPlayground,
  ApiUsage,
  WebhookSettings,
} from "../pages";

export const developerRoutes: RouteObject[] = [
  {
    element: (
      <RouteGuard>
        <DeveloperLayout />
      </RouteGuard>
    ),
    children: [
      { path: "/developer", element: <ApiPortal /> },
      { path: "/developer/keys", element: <ApiKeysPage /> },
      { path: "/developer/docs", element: <ApiDocs /> },
      { path: "/developer/playground", element: <ApiPlayground /> },
      { path: "/developer/usage", element: <ApiUsage /> },
      { path: "/developer/webhooks", element: <WebhookSettings /> },
    ],
  },
];