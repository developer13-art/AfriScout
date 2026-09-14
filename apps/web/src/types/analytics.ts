export interface OpportunityAnalytics {
  total: number;
  byCategory: Array<{ category: string; count: number }>;
  byCountry: Array<{ countryCode: string; count: number }>;
  byType: Array<{ opportunityType: string; count: number }>;
  publishedLast7Days: number;
  closingNext7Days: number;
}

export interface UserAnalytics {
  savedCount: number;
  watchlistCount: number;
  pipelineCount: number;
  applicationsSubmitted: number;
  wins: number;
  losses: number;
  winRate: number;
  byStage: Array<{ stage: string; count: number }>;
}

export interface BusinessAnalytics extends UserAnalytics {
  estimatedOpportunityValue: number;
  wonOpportunityValue: number;
  currency: string;
}

export interface AdminAnalytics {
  sourcesTotal: number;
  sourcesHealthy: number;
  sourcesWarning: number;
  sourcesFailed: number;
  sourcesInactive: number;
  opportunitiesTotal: number;
  opportunitiesPublished: number;
  opportunitiesExpired: number;
  duplicatesPending: number;
  changesLast24h: number;
  actorRunsLast24h: number;
  actorRunsFailedLast24h: number;
}