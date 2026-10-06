import pino from "pino";
import { env, isProduction } from "./env";

export const logger = pino({
  level: env.LOG_LEVEL,
  base: {
    service: "afriscout-api",
    env: env.NODE_ENV,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "*.password",
      "*.token",
      "*.apifyToken",
      "*.apiKey",
      "*.secret",
    ],
    remove: true,
  },
  transport: isProduction
    ? undefined
    : {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:HH:MM:ss",
          ignore: "pid,hostname,service,env",
        },
      },
});

export type Logger = typeof logger;