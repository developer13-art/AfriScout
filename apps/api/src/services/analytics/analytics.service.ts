import { userAnalytics } from "./userAnalytics.service";
import { businessAnalytics } from "./businessAnalytics.service";
import { opportunityAnalytics } from "./opportunityAnalytics.service";
import { adminAnalytics } from "./adminAnalytics.service";

export async function summary(userId: string) {
  const [user, opportunities] = await Promise.all([
    userAnalytics(userId),
    opportunityAnalytics(),
  ]);
  return { user, opportunities };
}

export async function scopedUserAnalytics(userId: string) {
  return userAnalytics(userId);
}

export async function scopedBusinessAnalytics(userId: string) {
  return businessAnalytics(userId);
}

export async function scopedAdminAnalytics() {
  return adminAnalytics();
}

export async function scopedOpportunityAnalytics() {
  return opportunityAnalytics();
}