import { env } from "../config/env";
import { http } from "./http";
import type { Organization, OrganizationMember, PublicOrganizationProfile } from "../types/organization";

const ACTIVE_ORGANIZATION_KEY = "scout.active-organization-id";

function setActiveOrganizationId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ACTIVE_ORGANIZATION_KEY, id);
  } catch {
    // The current page can still open the selected organization if storage is unavailable.
  }
}

async function getActiveOrganization(): Promise<Organization | null> {
  const organizations = await http<Organization[]>("/organizations/mine");
  let activeId: string | null = null;
  try {
    activeId = typeof window === "undefined"
      ? null
      : window.localStorage.getItem(ACTIVE_ORGANIZATION_KEY);
  } catch {
    activeId = null;
  }
  const active = organizations.find((organization) => organization.id === activeId);
  if (active) return active;
  const first = organizations[0] ?? null;
  if (first) setActiveOrganizationId(first.id);
  return first;
}

export const organizationService = {
  publicProfile: (slug: string) =>
    http<PublicOrganizationProfile>(
      `${env.apiUrl.replace(/\/api\/v\d+\/?$/, "")}/api/public/organizations/${encodeURIComponent(slug)}`,
      { auth: false },
    ),
  list: (page = 1, pageSize = 20) =>
    http<Organization[]>("/organizations", { query: { page, pageSize } }),
  mine: () => http<Organization[]>("/organizations/mine"),
  active: getActiveOrganization,
  setActive: setActiveOrganizationId,
  membership: (id: string) =>
    http<{ isMember: boolean; role: string | null }>(`/organizations/${id}/membership`),
  join: (id: string) =>
    http<OrganizationMember>(`/organizations/${id}/join`, { method: "POST" }),
  get: (id: string) => http<Organization>(`/organizations/${id}`),
  create: (organization: Partial<Organization>) =>
    http<Organization>("/organizations", {
      method: "POST",
      body: JSON.stringify(organization),
    }),
  update: (id: string, patch: Partial<Organization>) =>
    http<Organization>(`/organizations/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  members: (id: string) =>
    http<OrganizationMember[]>(`/organizations/${id}/members`),
  addMember: (id: string, userId: string, role: string) =>
    http<OrganizationMember>(`/organizations/${id}/members`, {
      method: "POST",
      body: JSON.stringify({ userId, role }),
    }),
  removeMember: (id: string, memberId: string) =>
    http<void>(`/organizations/${id}/members/${memberId}`, { method: "DELETE" }),
};