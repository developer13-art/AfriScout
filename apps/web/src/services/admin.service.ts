import { http } from "./http";
import type { User } from "../types/user";
import type { Source } from "../types/source";

export const adminService = {
  users: (page = 1, pageSize = 20) =>
    http<User[]>("/admin/users", { query: { page, pageSize } }),
  user: (id: string) => http<User>(`/admin/users/${id}`),
  updateUserRole: (id: string, role: string) =>
    http<User>(`/admin/users/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),
  updateUserStatus: (id: string, status: string) =>
    http<User>(`/admin/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  sources: (page = 1, pageSize = 20) =>
    http<Source[]>("/admin/sources", { query: { page, pageSize } }),
};