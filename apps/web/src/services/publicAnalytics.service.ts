import { env } from "../config/env";
import { http } from "./http";

const publicAnalyticsUrl = `${env.apiUrl.replace(/\/api\/v\d+\/?$/, "")}/api/public/analytics`;

export interface PublicTotals {
  opportunitiesTotal: number;
  opportunitiesPublished: number;
  opportunitiesClosingSoon: number;
  opportunitiesClosingToday: number;
  sourcesTotal: number;
  sourcesActive: number;
  countriesCovered: number;
  usersTotal: number;
}

export interface CategoryCount {
  category: string;
  count: number;
}

export interface CountryCount {
  countryCode: string;
  countryName: string | null;
  count: number;
}

export interface PublicTotalsResponse {
  totals: PublicTotals;
  byCategory: CategoryCount[];
}

export const publicAnalyticsService = {
  totals: () => http<PublicTotalsResponse>(`${publicAnalyticsUrl}/totals`, { auth: false }),
  countries: () => http<CountryCount[]>(`${publicAnalyticsUrl}/countries`, { auth: false }),
};
