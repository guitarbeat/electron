import fs from "node:fs";
import { createRequire } from "node:module";
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

const requireFromWeb = createRequire(import.meta.url);
const canonicalReactDir = fs.realpathSync(
  path.dirname(requireFromWeb.resolve("react/package.json")),
);
const canonicalReactDomDir = fs.realpathSync(
  path.dirname(requireFromWeb.resolve("react-dom/package.json")),
);

const reactSingletonAliases = {
  "react/jsx-runtime": path.join(canonicalReactDir, "jsx-runtime.js"),
  "react/jsx-dev-runtime": path.join(canonicalReactDir, "jsx-dev-runtime.js"),
  "react-dom/client": path.join(canonicalReactDomDir, "client.js"),
  "react-dom": canonicalReactDomDir,
  react: canonicalReactDir,
};

const aliasEntries = {
  ...reactSingletonAliases,
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
      const rootTarget = path.resolve(import.meta.dirname, "../../dist");
      const webDist = path.resolve(import.meta.dirname, "dist");
      if (fs.existsSync(source)) {
        fs.mkdirSync(rootTarget, { recursive: true });
        fs.cpSync(source, rootTarget, { recursive: true });
        const entries = fs.readdirSync(source);
        for (const entry of entries) {
          if (entry === "public") continue;
          fs.cpSync(path.join(source, entry), path.join(webDist, entry), { recursive: true });
        }
      }
    } catch (err) {
      console.warn("Failed to sync artifacts to dist targets:", err);
    }
  },
});

const createReactSingletonEsbuildPlugin = () => ({
  name: "electron-react-global-singleton",
  setup(build: {
    onLoad: (
      options: { filter: RegExp },
      callback: (args: { path: string }) => { contents: string; loader: "js" } | null,
    ) => void;
  }) {
    build.onLoad({ filter: /node_modules\/.*\/react\/index\.js$/ }, (args) => {
      const dir = path.dirname(args.path).replace(/\\/g, "/");
      return {
        loader: "js",
        contents: `
          const g = typeof globalThis !== "undefined" ? globalThis : window;
          const impl = process.env.NODE_ENV === "production"
            ? require("${dir}/cjs/react.production.js")
            : require("${dir}/cjs/react.development.js");
          module.exports = g.__ELECTRON_REACT_SINGLETON__ || (g.__ELECTRON_REACT_SINGLETON__ = impl);
        `,
      };
    });

    build.onLoad({ filter: /node_modules\/.*\/react\/jsx-runtime\.js$/ }, (args) => {
      const dir = path.dirname(args.path).replace(/\\/g, "/");
      return {
        loader: "js",
        contents: `
          const g = typeof globalThis !== "undefined" ? globalThis : window;
          const impl = process.env.NODE_ENV === "production"
            ? require("${dir}/cjs/react-jsx-runtime.production.js")
            : require("${dir}/cjs/react-jsx-runtime.development.js");
          module.exports = g.__ELECTRON_REACT_JSX_RUNTIME_SINGLETON__ || (g.__ELECTRON_REACT_JSX_RUNTIME_SINGLETON__ = impl);
        `,
      };
    });

    build.onLoad({ filter: /node_modules\/.*\/react\/jsx-dev-runtime\.js$/ }, (args) => {
      const dir = path.dirname(args.path).replace(/\\/g, "/");
      return {
        loader: "js",
        contents: `
          const g = typeof globalThis !== "undefined" ? globalThis : window;
          const impl = process.env.NODE_ENV === "production"
            ? require("${dir}/cjs/react-jsx-dev-runtime.production.js")
            : require("${dir}/cjs/react-jsx-dev-runtime.development.js");
          module.exports = g.__ELECTRON_REACT_JSX_DEV_RUNTIME_SINGLETON__ || (g.__ELECTRON_REACT_JSX_DEV_RUNTIME_SINGLETON__ = impl);
        `,
      };
    });

    build.onLoad({ filter: /node_modules\/.*\/react-dom\/index\.js$/ }, (args) => {
      const dir = path.dirname(args.path).replace(/\\/g, "/");
      return {
        loader: "js",
        contents: `
          const g = typeof globalThis !== "undefined" ? globalThis : window;
          const impl = process.env.NODE_ENV === "production"
            ? require("${dir}/cjs/react-dom.production.js")
            : require("${dir}/cjs/react-dom.development.js");
          module.exports = g.__ELECTRON_REACT_DOM_SINGLETON__ || (g.__ELECTRON_REACT_DOM_SINGLETON__ = impl);
        `,
      };
    });

    build.onLoad({ filter: /node_modules\/.*\/react-dom\/client\.js$/ }, (args) => {
      const dir = path.dirname(args.path).replace(/\\/g, "/");
      return {
        loader: "js",
        contents: `
          const g = typeof globalThis !== "undefined" ? globalThis : window;
          const impl = process.env.NODE_ENV === "production"
            ? require("${dir}/cjs/react-dom-client.production.js")
            : require("${dir}/cjs/react-dom-client.development.js");
          module.exports = g.__ELECTRON_REACT_DOM_CLIENT_SINGLETON__ || (g.__ELECTRON_REACT_DOM_CLIENT_SINGLETON__ = impl);
        `,
      };
    });
  },
});

export default defineConfig(({ mode }) => {
  const rootDir = path.resolve(import.meta.dirname, "../..");
  const envRoot = loadEnv(mode, rootDir, "");
  const envLocal = loadEnv(mode, import.meta.dirname, "");
  Object.assign(process.env, envRoot, envLocal);
  if (!process.env.DISABLE_HMR) {
    process.env.DISABLE_HMR = "true";
  }

  return {
    base: basePath,
    plugins: [
      react({ fastRefresh: false }),
      tailwindcss(),
      createServerlessRuntimeAdapter(),
      syncToRootDistPlugin(),
    ],
    // @tailwindcss/vite processes CSS with LightningCSS internally.
    // Explicitly setting css.transformer here caused an infinite transformation
    // loop during production builds, so it is disabled.
    // css: { transformer: 'lightningcss' },
    resolve: {
      preserveSymlinks: false,
      dedupe: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@radix-ui/react-alert-dialog",
        "motion",
        "lucide-react",
      ],
      alias: {
        ...aliasEntries,
      },
      extensionAlias: {
        ".ts": [".ts", ".tsx"],
        ".js": [".js", ".ts", ".tsx"],
      },
    },
    optimizeDeps: {
      entries: ["index.html", "src/main.tsx"],
      holdUntilCrawlEnd: true,
      ignoreOutdatedRequests: true,
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@radix-ui/react-alert-dialog",
        "@total-typescript/ts-reset",
        "@vercel/speed-insights/react",
        "clsx",
        "gsap",
        "lucide-react",
        "motion/react",
        "tailwind-merge",
        "zod",
      ],
      needsInterop: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@total-typescript/ts-reset",
      ],
      esbuildOptions: {
        plugins: [createReactSingletonEsbuildPlugin()],
      },
    },
    root: path.resolve(import.meta.dirname),
    build: {
      chunkSizeWarningLimit: 1000,
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
      target: "es2020",
      cssCodeSplit: true,
      modulePreload: { polyfill: true },
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return undefined;
            if (
              id.includes("/react/") ||
              id.includes("/react-dom/") ||
              id.includes("/scheduler/")
            ) {
              return "react-vendor";
            }
            if (id.includes("@tanstack/react-query")) {
              return "query-vendor";
            }
            if (id.includes("/gsap/") || id.includes("/motion/")) {
              return "motion-vendor";
            }
            if (
              id.includes("lucide-react") ||
              id.includes("@radix-ui/")
            ) {
              return "ui-vendor";
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
      cors: false,
      hmr: process.env.DISABLE_HMR !== "true",
      watch: process.env.DISABLE_HMR === "true" ? null : {},
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    },
    clearScreen: false,
    preview: {
      port,
      host: "0.0.0.0",
      allowedHosts: true,
      cors: false,
    },
  };
});
