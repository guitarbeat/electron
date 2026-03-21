import fs from 'fs';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

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
    server: {
      host: '0.0.0.0',
      port: 5000,
      allowedHosts: true,
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

                  const request = new Request(url, {
                    method: req.method,
                    headers,
                    body: body,
                    // Note: for GET/HEAD, body must be null or undefined
                    // our code ensures body is only populated for other methods
                  });

                  const response = await handler(request);

                  res.statusCode = response.status;
                  response.headers.forEach((value: string, key: string) => {
                    res.setHeader(key, value);
                  });

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
        '@/common': path.resolve(__dirname, 'src/components/common'),
        '@/effects': path.resolve(__dirname, 'src/components/effects'),
        '@/matchmaker': path.resolve(__dirname, 'src/components/matchmaker'),
        '@/memories': path.resolve(__dirname, 'src/components/memories'),
        '@/quiz': path.resolve(__dirname, 'src/components/quiz'),
        '@/ui': path.resolve(__dirname, 'src/components/ui'),
        '@/hooks': path.resolve(__dirname, 'src/hooks'),
        '@/app': path.resolve(__dirname, 'src/app'),
        '@/shared': path.resolve(__dirname, 'src/shared'),
        '@/theme': path.resolve(__dirname, 'src/theme'),
        '@/services': path.resolve(__dirname, 'src/services'),
        '@/utils': path.resolve(__dirname, 'src/utils'),
        '@': path.resolve(__dirname, 'src'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
              return 'react-vendor';
            }

            if (id.includes('node_modules/ogl')) {
              return 'graphics-vendor';
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
