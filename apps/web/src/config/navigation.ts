import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Compass,
  Sparkles,
  Bookmark,
  Eye,
  Workflow,
  Radar as RadarIcon,
  Bell,
  User,
  Settings,
  HelpCircle,
  Shield,
  Database,
  Activity,
  Layers,
  Users,
  Building2,
  BarChart3,
  KeyRound,
  Webhook,
  ScrollText,
  PlayCircle,
  FileStack,
  GitCompareArrows,
  AlertTriangle,
  Sliders,
  Code2,
  Gauge,
  BookOpen,
  TerminalSquare,
} from "lucide-react";

export type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  permission?: string;
  badgeKey?: "unreadNotifications" | "pendingDuplicates" | "failedSources";
};

export type NavSection = {
  id: string;
  label: string;
  items: NavItem[];
};

export const userNavigation: NavSection[] = [
  {
    id: "workspace",
    label: "Workspace",
    items: [
      { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
      { label: "Explore", to: "/explore", icon: Compass },
      { label: "Matches", to: "/matches", icon: Sparkles },
      { label: "Saved", to: "/saved", icon: Bookmark },
      { label: "Watchlist", to: "/watchlist", icon: Eye },
      { label: "Pipeline", to: "/pipeline", icon: Workflow },
      { label: "Radar", to: "/radar", icon: RadarIcon },
      { label: "Notifications", to: "/notifications", icon: Bell, badgeKey: "unreadNotifications" },
    ],
  },
  {
    id: "organization",
    label: "Organization",
    items: [
      { label: "Profile", to: "/org/profile", icon: Building2 },
      { label: "Team", to: "/org/team", icon: Users },
      { label: "Opportunities", to: "/org/opportunities", icon: Layers },
      { label: "Settings", to: "/org/settings", icon: Sliders },
    ],
  },
  {
    id: "developer",
    label: "Developer",
    items: [
      { label: "API Portal", to: "/developer", icon: Code2 },
      { label: "API Keys", to: "/developer/keys", icon: KeyRound },
      { label: "Documentation", to: "/developer/docs", icon: BookOpen },
      { label: "Playground", to: "/developer/playground", icon: TerminalSquare },
      { label: "Usage", to: "/developer/usage", icon: Gauge },
      { label: "Webhooks", to: "/developer/webhooks", icon: Webhook },
    ],
  },
  {
    id: "account",
    label: "Account",
    items: [
      { label: "Profile", to: "/profile", icon: User },
      { label: "Business DNA", to: "/dna", icon: Layers },
      { label: "Analytics", to: "/analytics", icon: BarChart3 },
      { label: "Ask AfriScout", to: "/ask", icon: Sparkles },
      { label: "Settings", to: "/settings", icon: Settings },
      { label: "Help", to: "/help", icon: HelpCircle },
    ],
  },
];

export const adminNavigation: NavSection[] = [
  {
    id: "operations",
    label: "Operations",
    items: [
      { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
      { label: "Sources", to: "/admin/sources", icon: Database },
      { label: "Suggested Sources", to: "/admin/sources/suggested", icon: FileStack },
      { label: "Actor Runs", to: "/admin/actor-runs", icon: PlayCircle, badgeKey: "failedSources" },
      { label: "Opportunities", to: "/admin/opportunities", icon: Layers },
      { label: "Organizations", to: "/admin/organizations", icon: Building2 },
      { label: "Users", to: "/admin/users", icon: Users },
    ],
  },
  {
    id: "quality",
    label: "Data quality",
    items: [
      { label: "Duplicates", to: "/admin/duplicates", icon: GitCompareArrows, badgeKey: "pendingDuplicates" },
      { label: "Changes", to: "/admin/changes", icon: Activity },
      { label: "Data Quality", to: "/admin/data-quality", icon: AlertTriangle },
      { label: "AI Monitoring", to: "/admin/ai-monitoring", icon: Sparkles },
    ],
  },
  {
    id: "platform",
    label: "Platform",
    items: [
      { label: "System Health", to: "/admin/system-health", icon: Gauge },
      { label: "Audit Logs", to: "/admin/audit-logs", icon: ScrollText },
      { label: "API Keys", to: "/admin/api-keys", icon: KeyRound },
      { label: "Webhooks", to: "/admin/webhooks", icon: Webhook },
      { label: "Notifications", to: "/admin/notifications", icon: Bell },
      { label: "Roles", to: "/admin/roles", icon: Shield },
      { label: "Settings", to: "/admin/settings", icon: Sliders },
    ],
  },
];

export const developerNavigation: NavSection[] = [
  {
    id: "developer",
    label: "Developer",
    items: [
      { label: "API Portal", to: "/developer", icon: Code2 },
      { label: "API Keys", to: "/developer/keys", icon: KeyRound },
      { label: "API Documentation", to: "/developer/docs", icon: ScrollText },
      { label: "API Playground", to: "/developer/playground", icon: PlayCircle },
      { label: "API Usage", to: "/developer/usage", icon: Gauge },
      { label: "Webhooks", to: "/developer/webhooks", icon: Webhook },
    ],
  },
];

export const publicNavigation: NavItem[] = [
  { label: "Home", to: "/", icon: LayoutDashboard },
  { label: "Explore", to: "/explore", icon: Compass },
  { label: "How It Works", to: "/how-it-works", icon: Sparkles },
  { label: "Sources", to: "/sources", icon: Database },
  { label: "About", to: "/about", icon: HelpCircle },
];