import { http } from "./http";

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
  totals: () => http<PublicTotalsResponse>("/public/analytics/totals", { auth: false }),
  countries: () => http<CountryCount[]>("/public/analytics/countries", { auth: false }),
};