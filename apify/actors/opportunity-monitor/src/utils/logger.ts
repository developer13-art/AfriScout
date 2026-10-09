import { Actor } from "apify";

export const log = {
  info(message: string, data?: Record<string, unknown>) {
    void Actor.log.info(message, data);
  },
  warn(message: string, data?: Record<string, unknown>) {
    void Actor.log.warning(message, data);
  },
  error(message: string, data?: Record<string, unknown>) {
    void Actor.log.error(message, data);
  },
};