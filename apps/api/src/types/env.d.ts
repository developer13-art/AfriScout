import type { env as EnvType } from "../config/env";

declare global {
  namespace NodeJS {
    interface ProcessEnv extends Partial<typeof EnvType> {}
  }
}

export {};