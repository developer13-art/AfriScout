import http from "node:http";
import { createApp } from "./app";
import { env, isProduction } from "./config/env";
import { logger } from "./config/logger";
import { connectDatabase, disconnectDatabase } from "./config/database";
import { disconnectRedis } from "./config/redis";

async function bootstrap(): Promise<void> {
  await connectDatabase();

  const app = createApp();
  const server = http.createServer(app);

  server.listen(env.API_PORT, env.API_HOST, () => {
    logger.info(
      { host: env.API_HOST, port: env.API_PORT, env: env.NODE_ENV },
      "api_server_listening",
    );
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "api_shutdown_started");
    server.close(async () => {
      await disconnectDatabase();
      await disconnectRedis();
      process.exit(0);
    });

    if (isProduction) {
      setTimeout(() => process.exit(1), 15_000).unref();
    }
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));

  process.on("unhandledRejection", (reason) => {
    logger.error({ reason }, "unhandled_rejection");
  });
  process.on("uncaughtException", (error) => {
    logger.fatal({ err: error }, "uncaught_exception");
    void shutdown("uncaughtException");
  });
}

bootstrap().catch((error) => {
  logger.fatal({ err: error }, "api_bootstrap_failed");
  process.exit(1);
});