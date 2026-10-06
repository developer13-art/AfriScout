import { useRoutes } from "react-router-dom";
import { publicRoutes } from "./publicRoutes";
import { authRoutes } from "./authRoutes";
import { userRoutes } from "./userRoutes";
import { adminRoutes } from "./adminRoutes";
import { developerRoutes } from "./developerRoutes";
import { orgRoutes } from "./orgRoutes";

export function AppRoutes() {
  return useRoutes([
    ...publicRoutes,
    ...authRoutes,
    ...userRoutes,
    ...adminRoutes,
    ...developerRoutes,
    ...orgRoutes,
  ]);
}