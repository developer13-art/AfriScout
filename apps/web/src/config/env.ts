type Env = {
  apiUrl: string;
  publicAppUrl: string;
  enableDevtools: boolean;
  isProduction: boolean;
  isDevelopment: boolean;
  isTest: boolean;
};

function readBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value === "true" || value === "1";
}

function readString(value: string | undefined, fallback: string): string {
  if (value === undefined || value.length === 0) return fallback;
  return value;
}

export const env: Env = {
  apiUrl: readString(import.meta.env.VITE_API_URL, "http://localhost:4000/api/v1"),
  publicAppUrl: readString(import.meta.env.VITE_PUBLIC_APP_URL, "http://localhost:5173"),
  enableDevtools: readBoolean(import.meta.env.VITE_ENABLE_DEVTOOLS, false),
  isProduction: import.meta.env.PROD,
  isDevelopment: import.meta.env.DEV,
  isTest: import.meta.env.MODE === "test",
};