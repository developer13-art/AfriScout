import type { RouteObject } from "react-router-dom";
import { PublicLayout } from "../layouts/PublicLayout";
import {
  Home,
  Explore,
  OpportunityDetails,
  Sources,
  HowItWorks,
  About,
  Pricing,
  Contact,
  Legal,
  Privacy,
  Terms,
  NotFound,
  ServerError,
  SolanaRadar,
  OpportunityGraph,
  OpportunityBlink,
  BountyMarketplace,
  OrganizationPublicProfile,
} from "../pages";

export const publicRoutes: RouteObject[] = [
  {
    element: <PublicLayout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/explore", element: <Explore /> },
      { path: "/solana-radar", element: <SolanaRadar /> },
      { path: "/bounties", element: <BountyMarketplace /> },
      { path: "/organizations/:slug", element: <OrganizationPublicProfile /> },
      { path: "/opportunity-network", element: <OpportunityGraph /> },
      { path: "/blink/:slug", element: <OpportunityBlink /> },
      { path: "/opportunities/:slug", element: <OpportunityDetails /> },
      { path: "/sources", element: <Sources /> },
      { path: "/how-it-works", element: <HowItWorks /> },
      { path: "/about", element: <About /> },
      { path: "/pricing", element: <Pricing /> },
      { path: "/contact", element: <Contact /> },
      { path: "/legal", element: <Legal /> },
      { path: "/privacy", element: <Privacy /> },
      { path: "/terms", element: <Terms /> },
      { path: "/500", element: <ServerError /> },
      { path: "*", element: <NotFound /> },
    ],
  },
];
