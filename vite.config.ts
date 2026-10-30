import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  root: path.resolve(__dirname, "apps/web"),
  publicDir: path.resolve(__dirname, "apps/web/public"),
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "apps/web/src"),
      "@workspace/api-zod": path.resolve(__dirname, "lib/api-zod/src/index.ts"),
    },
  },
  server: {
    port: 3000,
    host: "0.0.0.0",
    allowedHosts: true,
    hmr: process.env.DISABLE_HMR !== "true",
    watch: process.env.DISABLE_HMR === "true" ? null : {},
  },
  preview: {
    allowedHosts: true,
  },
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
  },
});
