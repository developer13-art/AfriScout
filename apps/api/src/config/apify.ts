import { env } from "./env";

export interface ApifyConfig {
  token: string;
  baseUrl: string;
  actors: {
    opportunityDiscovery: string;
    documentExtractor: string;
    opportunityMonitor: string;
  };
  webhookSecret: string;
  defaultTimeoutSeconds: number;
  defaultMemoryMb: number;
  isConfigured: boolean;
}

export const apifyConfig: ApifyConfig = {
  token: env.APIFY_TOKEN,
  baseUrl: env.APIFY_BASE_URL,
  actors: {
    opportunityDiscovery: env.APIFY_OPPORTUNITY_DISCOVERY_ACTOR_ID,
    documentExtractor: env.APIFY_DOCUMENT_EXTRACTOR_ACTOR_ID,
    opportunityMonitor: env.APIFY_OPPORTUNITY_MONITOR_ACTOR_ID,
  },
  webhookSecret: env.APIFY_WEBHOOK_SECRET,
  defaultTimeoutSeconds: env.APIFY_DEFAULT_TIMEOUT_SECONDS,
  defaultMemoryMb: env.APIFY_DEFAULT_MEMORY_MB,
  isConfigured: env.APIFY_TOKEN.length > 0,
};