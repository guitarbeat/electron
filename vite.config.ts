import fs from 'fs';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { applyFetchResponseHeaders } from './api/_lib/nodeBridge.ts';

const resolveFromRoot = (subpath: string): string => path.resolve(__dirname, subpath);

const aliasEntries = {
  '@/app': resolveFromRoot('src/app'),
  '@/branding': resolveFromRoot('src/branding'),
  '@/common': resolveFromRoot('src/components/common'),
  '@/components': resolveFromRoot('src/components'),
  '@/effects': resolveFromRoot('src/components/effects'),
  '@/hooks': resolveFromRoot('src/hooks'),
  '@/matchmaker': resolveFromRoot('src/components/matchmaker'),
  '@/memories': resolveFromRoot('src/components/memories'),
  '@/quiz': resolveFromRoot('src/components/quiz'),
  '@/services': resolveFromRoot('src/services'),
  '@/shared': resolveFromRoot('src/shared'),
  '@/theme': resolveFromRoot('src/theme'),
  '@/ui': resolveFromRoot('src/components/ui'),
  '@/utils': resolveFromRoot('src/utils'),
  '@': resolveFromRoot('src'),
} satisfies Record<string, string>;

const resolveApiModulePath = (apiPath: string): string => {
  const exactFilePath = path.resolve(__dirname, `.${apiPath}.ts`);
  if (fs.existsSync(exactFilePath)) {
    return exactFilePath;
  }

  const segments = apiPath.split('/').filter(Boolean);

  if (segments.length === 3 && segments[0] === 'api' && segments[1] === 'state') {
    return path.resolve(__dirname, './api/state/[scope].ts');
  }

  if (
    segments.length === 4 &&
    segments[0] === 'api' &&
    segments[1] === 'state' &&
    segments[3] === 'mutate'
  ) {
    return path.resolve(__dirname, './api/state/[scope]/mutate.ts');
  }

  return exactFilePath;
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Ensure VITE_ variables are available in process.env for our serverless handlers
  Object.assign(process.env, env);

  return {
    css: { transformer: 'lightningcss' },
    server: {
      host: '0.0.0.0',
      port: 5000,
      allowedHosts: true,
      watch: {
        ignored: ['**/.local/share/pnpm/store/**', '**/node_modules/.pnpm/store/**'],
      },
    },
    plugins: [
      react(),
      {
        name: 'api-proxy',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url && req.url.startsWith('/api/')) {
              try {
                const apiPath = req.url.split('?')[0];
                const filePath = resolveApiModulePath(apiPath);

                // Use Vite's SSR loader to execute the .ts files in Node
                const module = await server.ssrLoadModule(filePath);
                const handler = module.default;

                if (typeof handler === 'function') {
                  const url = new URL(req.url, `http://${req.headers.host}`);

                  // Read request body for POST/PATCH
                  let body: ArrayBuffer | undefined;
                  if (req.method !== 'GET' && req.method !== 'HEAD') {
                    const rawBody = await new Promise<Buffer>((resolve) => {
                      const chunks: Buffer[] = [];
                      req.on('data', chunk => chunks.push(chunk));
                      req.on('end', () => resolve(Buffer.concat(chunks)));
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

                  if (body !== undefined && req.method !== 'GET' && req.method !== 'HEAD') {
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
                // Don't terminate, maybe it's not a function or file
              }
            }
            next();
          });
        },
      },
    ],
    resolve: {
      alias: {
        ...aliasEntries,
        // Force motion/react to use the same React instance as the app
        react: resolveFromRoot('node_modules/react'),
        'react-dom': resolveFromRoot('node_modules/react-dom'),
      },
      extensionAlias: {
        '.ts': ['.ts', '.tsx'],
        '.js': ['.js', '.ts', '.tsx'],
      },
    },
    build: {
      // The MapLibre bundle is isolated behind a lazy PlacesMap import, so the
      // default 500 kB warning is noisy for this repo. Keep the threshold just
      // above that expected lazy chunk size so real regressions still stand out.
      chunkSizeWarningLimit: 1100,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
              return 'react-vendor';
            }

            if (
              id.includes('node_modules/framer-motion/') ||
              id.includes('node_modules/motion/')
            ) {
              return 'framer-vendor';
            }

            if (id.includes('node_modules/maplibre-gl')) {
              return 'map-vendor';
            }

            if (
              id.includes('node_modules/ogl') ||
              id.includes('node_modules/three')
            ) {
              return 'graphics-vendor';
            }

            if (id.includes('node_modules/gsap')) {
              return 'motion-vendor';
            }

            if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) {
              return 'charts-vendor';
            }

            if (id.includes('node_modules/date-fns')) {
              return 'date-vendor';
            }

            if (id.includes('node_modules/lucide-react')) {
              return 'icons-vendor';
            }

            if (
              id.includes('node_modules/dompurify') ||
              id.includes('node_modules/isomorphic-dompurify') ||
              id.includes('node_modules/html-react-parser')
            ) {
              return 'sanitize-vendor';
            }

            if (id.includes('node_modules')) {
              return 'vendor';
            }

            return undefined;
          },
        },
      },
    },
  };
});
