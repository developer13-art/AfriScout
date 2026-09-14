export const appConfig = {
  name: "AfriScout",
  tagline: "Africa's Opportunity Intelligence Platform",
  shortDescription:
    "Discover Opportunities. Understand Them. Act With Confidence.",
  defaultLocale: "en",
  defaultCurrency: "USD",
  supportEmail: "support@afriscout.example",
  privacyEmail: "privacy@afriscout.example",
  legalEmail: "legal@afriscout.example",
  links: {
    documentation: "/docs",
    status: "/status",
    terms: "/terms",
    privacy: "/privacy",
    contact: "/contact",
  },
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },
  search: {
    debounceMs: 300,
    minQueryLength: 2,
  },
  notifications: {
    pollIntervalMs: 60_000,
  },
} as const;

export type AppConfig = typeof appConfig;