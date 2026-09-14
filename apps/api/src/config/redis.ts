import IORedis, { type Redis } from "ioredis";
import { env, isTest } from "./env";
import { logger } from "./logger";

const globalForRedis = globalThis as unknown as {
  redis?: Redis;
};

function createClient(): Redis {
  const client = new IORedis(env.REDIS_URL, {
    keyPrefix: `${env.REDIS_PREFIX}:`,
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: false,
    tls: env.REDIS_TLS ? {} : undefined,
  });

  client.on("error", (error) => {
    logger.error({ err: error }, "Redis error");
  });

  client.on("connect", () => {
    logger.info("Redis connection established");
  });

  return client;
}

export const redis: Redis = globalForRedis.redis ?? createClient();

if (!isTest) {
  globalForRedis.redis = redis;
}

export function createBullConnection(): Redis {
  return new IORedis(env.REDIS_URL, {
    keyPrefix: `${env.REDIS_PREFIX}:bull:`,
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    tls: env.REDIS_TLS ? {} : undefined,
  });
}

export async function disconnectRedis(): Promise<void> {
  if (isTest) return;
  try {
    await redis.quit();
    logger.info("Redis connection closed");
  } catch (error) {
    logger.error({ err: error }, "Redis disconnect failed");
  }
}