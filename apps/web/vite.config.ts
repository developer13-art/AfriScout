import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, "../.."), "");
  const apiUrl = env.VITE_API_URL ?? "http://localhost:4000/api/v1";

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        "@afriscout/shared": path.resolve(__dirname, "../../packages/shared/src"),
      },
    },
    server: {
      port: 5173,
      strictPort: false,
      proxy: {
        "/api": {
          target: apiUrl.replace(/\/api\/v1$/, ""),
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: "dist",
      sourcemap: mode !== "production",
      target: "es2022",
      chunkSizeWarningLimit: 1200,
    },
    preview: {
      port: 4173,
    },
  };
});