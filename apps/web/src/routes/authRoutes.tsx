import type { RouteObject } from "react-router-dom";
import { AuthLayout } from "../layouts/AuthLayout";
import {
  Login,
  Register,
  ForgotPassword,
  ResetPassword,
  VerifyEmail,
  AcceptInvite,
  Onboarding,
} from "../pages";

export const authRoutes: RouteObject[] = [
  {
    element: <AuthLayout />,
    children: [
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
      { path: "/forgot-password", element: <ForgotPassword /> },
      { path: "/reset-password", element: <ResetPassword /> },
      { path: "/verify-email", element: <VerifyEmail /> },
      { path: "/accept-invite", element: <AcceptInvite /> },
      { path: "/onboarding", element: <Onboarding /> },
    ],
  },
];