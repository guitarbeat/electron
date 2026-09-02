import fs from "node:fs";
import path from "path";
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { createServerlessRuntimeAdapter } from "./devServerlessRuntime.ts";

// Dev server must run on port 3000 for AI Studio iFrame preview.
// The system might inject PORT=8080, which can conflict, so we handle it robustly.
const rawPort = process.env.PORT;
let port = 3000;

if (rawPort) {
  const parsedPort = parseInt(rawPort, 10);
  if (!Number.isNaN(parsedPort) && parsedPort > 0 && parsedPort < 65536 && parsedPort !== 8080) {
    port = parsedPort;
  } else {
    console.warn(`Warning: Ignoring PORT "${rawPort}". Using default port ${port}.`);
  }
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

const syncToRootDistPlugin = (): Plugin => ({
  name: "sync-to-root-dist",
  closeBundle() {
    try {
      const source = path.resolve(import.meta.dirname, "dist/public");
      const target = path.resolve(import.meta.dirname, "../../dist");
      if (fs.existsSync(source)) {
        fs.mkdirSync(target, { recursive: true });
        fs.cpSync(source, target, { recursive: true });
      }
    } catch (err) {
      console.warn("Failed to sync artifacts to root dist:", err);
    }
  },
});

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
    createServerlessRuntimeAdapter(),
    syncToRootDistPlugin(),
  ],
  // @tailwindcss/vite processes CSS with LightningCSS internally.
  // Explicitly setting css.transformer here caused an infinite transformation
  // loop during production builds, so it is disabled.
  // css: { transformer: 'lightningcss' },
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      ...aliasEntries,
    },
    extensionAlias: {
      ".ts": [".ts", ".tsx"],
      ".js": [".js", ".ts", ".tsx"],
    },
  },
  root: path.resolve(import.meta.dirname),
  build: {
    chunkSizeWarningLimit: 1000,
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    target: "es2022",
    cssCodeSplit: true,
    modulePreload: { polyfill: true },
    sourcemap: false,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    cors: true,
    allowedHosts: true,
    hmr: false,
    watch: {
      ignored: [
        "**/.local/share/pnpm/store/**",
        "**/node_modules/.pnpm/store/**",
      ],
    },
  },
  clearScreen: false,
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
  };
});
