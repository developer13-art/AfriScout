import type { RouteObject } from "react-router-dom";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { RouteGuard } from "../components/common/RouteGuard";
import {
  Dashboard,
  Profile,
  DNA,
  Matches,
  Saved,
  Watchlist,
  Radar,
  Pipeline,
  PipelineDetail,
  Notifications,
  Analytics,
  AskAfriScoutPage,
  Settings,
  Help,
} from "../pages";

export const userRoutes: RouteObject[] = [
  {
    element: (
      <RouteGuard>
        <DashboardLayout />
      </RouteGuard>
    ),
    children: [
      { path: "/dashboard", element: <Dashboard /> },
      { path: "/profile", element: <Profile /> },
      { path: "/dna", element: <DNA /> },
      { path: "/matches", element: <Matches /> },
      { path: "/saved", element: <Saved /> },
      { path: "/watchlist", element: <Watchlist /> },
      { path: "/radar", element: <Radar /> },
      { path: "/pipeline", element: <Pipeline /> },
      { path: "/pipeline/:itemId", element: <PipelineDetail /> },
      { path: "/notifications", element: <Notifications /> },
      { path: "/analytics", element: <Analytics /> },
      { path: "/ask", element: <AskAfriScoutPage /> },
      { path: "/settings", element: <Settings /> },
      { path: "/help", element: <Help /> },
    ],
  },
];