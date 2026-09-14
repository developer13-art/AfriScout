import { http } from "./http";
import type { Organization, OrganizationMember } from "../types/organization";

export const organizationService = {
  list: (page = 1, pageSize = 20) =>
    http<Organization[]>("/organizations", { query: { page, pageSize } }),
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