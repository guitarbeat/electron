import fs from "fs";
import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { applyFetchResponseHeaders } from "./nodeBridge.ts";

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

const resolveApiModulePath = (apiPath: string): string => {
  const exactFilePath = path.resolve(import.meta.dirname, `.${apiPath}.ts`);
  if (fs.existsSync(exactFilePath)) {
    return exactFilePath;
  }

  const segments = apiPath.split("/").filter(Boolean);

  if (
    segments.length === 3 &&
    segments[0] === "api" &&
    segments[1] === "state"
  ) {
    return path.resolve(import.meta.dirname, "./api/state/[scope].ts");
  }

  if (
    segments.length === 4 &&
    segments[0] === "api" &&
    segments[1] === "state" &&
    segments[3] === "mutate"
  ) {
    return path.resolve(
      import.meta.dirname,
      "./api/state/[scope]/mutate.ts",
    );
  }

  return exactFilePath;
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
    {
      name: "api-proxy",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url && req.url.startsWith("/api/")) {
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
            res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
            if (req.method === "OPTIONS") {
              res.statusCode = 204;
              res.end();
              return;
            }
            try {
              const apiPath = req.url.split("?")[0];
              const filePath = resolveApiModulePath(apiPath);

              const module = await server.ssrLoadModule(filePath);
              const handler = module.default;

              if (typeof handler === "function") {
                const url = new URL(req.url, `http://${req.headers.host}`);

                let body: ArrayBuffer | undefined;
                if (req.method !== "GET" && req.method !== "HEAD") {
                  const rawBody = await new Promise<Buffer>((resolve) => {
                    const chunks: Buffer[] = [];
                    req.on("data", (chunk) => chunks.push(chunk));
                    req.on("end", () => resolve(Buffer.concat(chunks)));
                  });
                  const bodyBytes = new Uint8Array(rawBody.byteLength);
                  bodyBytes.set(rawBody);
                  body = bodyBytes.buffer;
                }

                const headers = new Headers();
                for (const [key, value] of Object.entries(req.headers)) {
                  if (value === undefined) continue;
                  if (Array.isArray(value)) {
                    value.forEach((v) => headers.append(key, v));
                  } else {
                    headers.set(key, value);
                  }
                }

                const init: RequestInit = {
                  method: req.method,
                  headers,
                };

                if (
                  body !== undefined &&
                  req.method !== "GET" &&
                  req.method !== "HEAD"
                ) {
                  init.body = body;
                }

                const request = new Request(url, init);

                const response = await handler(request);

                res.statusCode = response.status;
                applyFetchResponseHeaders(res, response);

                const responseBody = await response.arrayBuffer();
                res.end(Buffer.from(responseBody));
                return;
              }
            } catch (err) {
              console.error(`Error in API proxy for ${req.url}:`, err);
            }
          }
          next();
        });
      },
    },
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
          // Match framer-motion and the motion package (its runtime core).
          if (
            id.includes("/node_modules/framer-motion/") ||
            id.includes("/node_modules/motion/")
          ) {
            return "framer-vendor";
          }
          if (id.includes("/node_modules/maplibre-gl/")) {
            return "map-vendor";
          }
          if (
            id.includes("/node_modules/ogl/") ||
            id.includes("/node_modules/three/")
          ) {
            return "graphics-vendor";
          }
          if (id.includes("/node_modules/gsap/")) {
            return "motion-vendor";
          }
          if (id.includes("/node_modules/recharts/") || id.includes("/node_modules/d3-")) {
            return "charts-vendor";
          }
          if (id.includes("/node_modules/date-fns/")) {
            return "date-vendor";
          }
          if (id.includes("/node_modules/lucide-react/")) {
            return "icons-vendor";
          }
          if (
            id.includes("/node_modules/dompurify/") ||
            id.includes("/node_modules/isomorphic-dompurify/") ||
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
