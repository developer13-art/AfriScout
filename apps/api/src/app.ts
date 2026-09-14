import express from "express";
import type { Application } from "express";
import { corsMiddleware } from "./middleware/cors.middleware";
import { securityMiddleware } from "./middleware/security.middleware";
import { requestIdMiddleware } from "./middleware/requestId.middleware";
import { requestLoggerMiddleware } from "./middleware/requestLogger.middleware";
import { errorMiddleware, notFoundMiddleware } from "./middleware/error.middleware";
import { rateLimit } from "./middleware/rateLimit.middleware";
import { env } from "./config/env";
import apiRoutes from "./routes";

export function createApp(): Application {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  // Raw body capture for webhook signature verification.
  app.use((req, _res, next) => {
    if (req.path.startsWith("/webhooks/apify")) {
      const chunks: Buffer[] = [];
      req.on("data", (chunk: Buffer) => chunks.push(chunk));
      req.on("end", () => {
        req.rawBody = Buffer.concat(chunks);
        try {
          req.body = JSON.parse(req.rawBody.toString("utf8"));
        } catch {
          req.body = {};
        }
        next();
      });
    } else {
      next();
    }
  });

  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true, limit: "2mb" }));

  for (const middleware of securityMiddleware) app.use(middleware);
  app.use(corsMiddleware);
  app.use(requestIdMiddleware);
  app.use(requestLoggerMiddleware);

  app.use(rateLimit({ keyPrefix: "global" }));

  app.use("/api", apiRoutes);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}

export { env };