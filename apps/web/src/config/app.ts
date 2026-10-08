export const appConfig = {
  name: "Scout",
  tagline: "The Global Opportunity Intelligence Network",
  shortDescription:
    "Discover opportunities. Understand them. Match with confidence. Build a reputation you can carry.",
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