import { fileURLToPath } from "node:url";
import path from "node:path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv({ path: path.resolve(__dirname, "../../../../.env") });

const booleanFromEnv = z
  .union([z.boolean(), z.string()])
  .transform((value) => {
    if (typeof value === "boolean") return value;
    const v = value.trim().toLowerCase();
    return v === "true" || v === "1" || v === "yes" || v === "on";
  });
const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_NAME: z.string().default("AfriScout"),
  APP_URL: z.string().url().default("http://localhost:5173"),
  API_URL: z.string().url().default("http://localhost:4000"),
  API_PORT: z.coerce.number().int().positive().default(4000),
  API_HOST: z.string().default("0.0.0.0"),
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).default("info"),
  TZ: z.string().default("UTC"),

  DATABASE_URL: z.string().min(1),
  DATABASE_POOL_MIN: z.coerce.number().int().nonnegative().default(2),
  DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),
  DATABASE_SSL: booleanFromEnv.default(false),

  REDIS_URL: z.string().min(1),
  REDIS_PREFIX: z.string().default("afriscout"),
  REDIS_TLS: booleanFromEnv.default(false),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),
  JWT_ISSUER: z.string().default("afriscout"),
  JWT_AUDIENCE: z.string().default("afriscout-web"),
  PASSWORD_HASH_MEMORY_COST: z.coerce.number().int().positive().default(19456),
  PASSWORD_HASH_TIME_COST: z.coerce.number().int().positive().default(2),
  PASSWORD_HASH_PARALLELISM: z.coerce.number().int().positive().default(1),

  SUPER_ADMIN_EMAIL: z.string().email(),
  SUPER_ADMIN_PASSWORD: z.string().min(8),
  SUPER_ADMIN_FULL_NAME: z.string().min(1),

  CORS_ORIGINS: z.string().default(""),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),
  RATE_LIMIT_API_KEY_MAX: z.coerce.number().int().positive().default(600),

  APIFY_TOKEN: z.string().default(""),
  APIFY_BASE_URL: z.string().url().default("https://api.apify.com/v2"),
  APIFY_OPPORTUNITY_DISCOVERY_ACTOR_ID: z.string().default(""),
  APIFY_DOCUMENT_EXTRACTOR_ACTOR_ID: z.string().default(""),
  APIFY_OPPORTUNITY_MONITOR_ACTOR_ID: z.string().default(""),
  APIFY_WEBHOOK_SECRET: z.string().min(16),
  APIFY_DEFAULT_TIMEOUT_SECONDS: z.coerce.number().int().positive().default(600),
  APIFY_DEFAULT_MEMORY_MB: z.coerce.number().int().positive().default(1024),

  AI_ENABLED: booleanFromEnv.default(true),
  AI_PROVIDER_PRIMARY: z.enum(["openai", "anthropic", "gemini", "mock"]).default("openai"),
  AI_PROVIDER_FALLBACK_1: z.enum(["openai", "anthropic", "gemini", "mock", ""]).default("anthropic"),
  AI_PROVIDER_FALLBACK_2: z.enum(["openai", "anthropic", "gemini", "mock", ""]).default("gemini"),
  AI_PROVIDER_FALLBACK_3: z.enum(["openai", "anthropic", "gemini", "mock", ""]).default("mock"),
  AI_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(60000),
  AI_MAX_RETRIES: z.coerce.number().int().nonnegative().default(2),

  OPENAI_API_KEY: z.string().default(""),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  OPENAI_BASE_URL: z.string().url().default("https://api.openai.com/v1"),

  ANTHROPIC_API_KEY: z.string().default(""),
  ANTHROPIC_MODEL: z.string().default("claude-3-5-sonnet-latest"),
  ANTHROPIC_BASE_URL: z.string().url().default("https://api.anthropic.com"),

  GEMINI_API_KEY: z.string().default(""),
  GEMINI_MODEL: z.string().default("gemini-1.5-flash"),
  GEMINI_BASE_URL: z.string().url().default("https://generativelanguage.googleapis.com"),

  SMTP_ENABLED: booleanFromEnv.default(false),
  SMTP_HOST: z.string().default(""),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: booleanFromEnv.default(false),
  SMTP_USER: z.string().default(""),
  SMTP_PASSWORD: z.string().default(""),
  SMTP_FROM_EMAIL: z.string().email().default("no-reply@afriscout.local"),
  SMTP_FROM_NAME: z.string().default("AfriScout"),

  WEB_PUSH_ENABLED: booleanFromEnv.default(false),
  WEB_PUSH_PUBLIC_KEY: z.string().default(""),
  WEB_PUSH_PRIVATE_KEY: z.string().default(""),
  WEB_PUSH_SUBJECT: z.string().default("mailto:admin@afriscout.local"),

  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  STORAGE_LOCAL_PATH: z.string().default("./.storage"),
  S3_ENDPOINT: z.string().default(""),
  S3_REGION: z.string().default(""),
  S3_BUCKET: z.string().default(""),
  S3_ACCESS_KEY_ID: z.string().default(""),
  S3_SECRET_ACCESS_KEY: z.string().default(""),
  S3_FORCE_PATH_STYLE: booleanFromEnv.default(false),

  OUTBOUND_WEBHOOK_SECRET: z.string().min(16),
  OUTBOUND_WEBHOOK_MAX_ATTEMPTS: z.coerce.number().int().positive().default(6),
  OUTBOUND_WEBHOOK_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),

  WORKER_CONCURRENCY: z.coerce.number().int().positive().default(5),
  QUEUE_PREFIX: z.string().default("afriscout"),
  JOB_ATTEMPTS_DEFAULT: z.coerce.number().int().positive().default(5),
  JOB_BACKOFF_MS: z.coerce.number().int().positive().default(5000),

  SCHEDULER_ENABLED: booleanFromEnv.default(true),
  SCHEDULER_SOURCE_TICK_CRON: z.string().default("*/15 * * * *"),
  SCHEDULER_DEADLINE_TICK_CRON: z.string().default("0 * * * *"),
  SCHEDULER_EXPIRY_TICK_CRON: z.string().default("0 2 * * *"),
  SCHEDULER_HEALTH_TICK_CRON: z.string().default("*/5 * * * *"),

  SENTRY_DSN: z.string().default(""),
  SENTRY_ENVIRONMENT: z.string().default("development"),

  FEATURE_ASK_AFRISCOUT: booleanFromEnv.default(true),
  FEATURE_OPPORTUNITY_MAP: booleanFromEnv.default(true),
  FEATURE_API_PORTAL: booleanFromEnv.default(true),
  FEATURE_PUBLIC_API: booleanFromEnv.default(true),

  PLAN_FREE_RPM: z.coerce.number().int().positive().default(60),
  PLAN_PRO_RPM: z.coerce.number().int().positive().default(300),
  PLAN_BUSINESS_RPM: z.coerce.number().int().positive().default(1200),
  PLAN_ENTERPRISE_RPM: z.coerce.number().int().positive().default(6000),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Environment validation failed:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const corsOrigins = env.CORS_ORIGINS.split(",")
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

export const isProduction = env.NODE_ENV === "production";
export const isDevelopment = env.NODE_ENV === "development";
export const isTest = env.NODE_ENV === "test";

export type Env = typeof env;