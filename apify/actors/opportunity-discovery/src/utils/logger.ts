import { log as apifyLog } from "apify";

export const log = {
  info(message: string, data?: Record<string, unknown>) {
    apifyLog.info(message, data);
  },
  warn(message: string, data?: Record<string, unknown>) {
    apifyLog.warning(message, data);
  },
  error(message: string, data?: Record<string, unknown>) {
    apifyLog.error(message, data);
  },
};