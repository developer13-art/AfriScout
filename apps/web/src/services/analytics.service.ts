import { http } from "./http";
import type {
  AdminAnalytics,
  BusinessAnalytics,
  OpportunityAnalytics,
  UserAnalytics,
} from "../types/analytics";

export const analyticsService = {
  opportunities: () => http<OpportunityAnalytics>("/analytics/opportunities"),
  user: () => http<UserAnalytics>("/analytics/me"),
  business: () => http<BusinessAnalytics>("/analytics/me/business"),
  admin: () => http<AdminAnalytics>("/analytics/admin"),
};