import { env } from "./env";

export interface ApifyConfig {
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
  actors: {
    opportunityDiscovery: env.APIFY_OPPORTUNITY_DISCOVERY_ACTOR_ID,
    documentExtractor: env.APIFY_DOCUMENT_EXTRACTOR_ACTOR_ID,
    opportunityMonitor: env.APIFY_OPPORTUNITY_MONITOR_ACTOR_ID,
  },
  webhookSecret: env.APIFY_WEBHOOK_SECRET,
  defaultTimeoutSeconds: env.APIFY_DEFAULT_TIMEOUT_SECONDS,
  defaultMemoryMb: env.APIFY_DEFAULT_MEMORY_MB,
  isConfigured: Boolean(env.APIFY_OPPORTUNITY_DISCOVERY_ACTOR_ID && env.APIFY_TOKEN),
};