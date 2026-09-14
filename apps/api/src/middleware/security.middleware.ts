import helmet from "helmet";
import hpp from "hpp";
import type { RequestHandler } from "express";

export const securityMiddleware: RequestHandler[] = [
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
  hpp(),
];