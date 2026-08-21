import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { createServerlessRuntimeAdapter } from "./devServerlessRuntime.ts";

// PORT and BASE_PATH are only meaningful for the dev/preview server. During a
// production `vite build` (e.g. on Vercel) they are not provided, so we fall
// back to sensible defaults there instead of throwing.
const isServe = process.argv.includes("serve") || process.argv.includes("dev");

const rawPort = process.env.PORT;

if (isServe && !rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = rawPort ? Number(rawPort) : 5173;

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH ?? "/";

const resolveFromRoot = (subpath: string): string =>
  path.resolve(import.meta.dirname, subpath);

const aliasEntries = {
  "@/app": resolveFromRoot("src/app"),
  "@/branding": resolveFromRoot("src/branding"),
  "@/common": resolveFromRoot("src/components/common"),
  "@/components": resolveFromRoot("src/components"),
  "@/effects": resolveFromRoot("src/components/effects"),
  "@/hooks": resolveFromRoot("src/hooks"),
  "@/matchmaker": resolveFromRoot("src/components/matchmaker"),
  "@/memories": resolveFromRoot("src/components/memories"),
  "@/quiz": resolveFromRoot("src/components/quiz"),
  "@/services": resolveFromRoot("src/services"),
  "@/shared": resolveFromRoot("src/shared"),
  "@/theme": resolveFromRoot("src/theme"),
  "@/ui": resolveFromRoot("src/components/ui"),
  "@/utils": resolveFromRoot("src/utils"),
  "@": resolveFromRoot("src"),
};

export default defineConfig(({ mode }) => {
  const rootDir = path.resolve(import.meta.dirname, "../..");
  const envRoot = loadEnv(mode, rootDir, "");
  const envLocal = loadEnv(mode, import.meta.dirname, "");
  Object.assign(process.env, envRoot, envLocal);

  return {
    base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    createServerlessRuntimeAdapter(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          runtimeErrorOverlay(),
        ]
      : []),
  ],
  css: { transformer: 'lightningcss' },
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      ...aliasEntries,
      react: resolveFromRoot("node_modules/react"),
      "react-dom": resolveFromRoot("node_modules/react-dom"),
    },
    extensionAlias: {
      ".ts": [".ts", ".tsx"],
      ".js": [".js", ".ts", ".tsx"],
    },
  },
  root: path.resolve(import.meta.dirname),
  build: {
    chunkSizeWarningLimit: 1100,
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    target: "es2022",
    cssCodeSplit: true,
    modulePreload: { polyfill: true },
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes("/node_modules/react/") ||
            id.includes("/node_modules/react-dom/") ||
            id.includes("/node_modules/scheduler/") ||
            id.includes("/node_modules/use-sync-external-store/") ||
            id.includes("/node_modules/object-assign/") ||
            id.includes("/node_modules/react-is/")
          ) {
            return "react-vendor";
          }
          if (id.includes("/node_modules/motion/")) {
            return "motion-vendor";
          }
          if (id.includes("/node_modules/maplibre-gl/")) {
            return "map-vendor";
          }
          if (id.includes("/node_modules/lucide-react/")) {
            return "icons-vendor";
          }
          if (
            id.includes("/node_modules/dompurify/") ||
            id.includes("/node_modules/html-react-parser/")
          ) {
            return "sanitize-vendor";
          }
          if (id.includes("/node_modules/")) {
            return "vendor";
          }
          return undefined;
        },
      },
    },
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    watch: {
      ignored: [
        "**/.local/share/pnpm/store/**",
        "**/node_modules/.pnpm/store/**",
      ],
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
  };
});
