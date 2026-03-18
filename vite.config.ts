import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

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
                const filePath = path.resolve(__dirname, `.${apiPath}.ts`);

                // Use Vite's SSR loader to execute the .ts files in Node
                const module = await server.ssrLoadModule(filePath);
                const handler = module.default;

                if (typeof handler === 'function') {
                  const url = new URL(req.url, `http://${req.headers.host}`);

                  // Read request body for POST/PATCH
                  let body: Buffer | null = null;
                  if (req.method !== 'GET' && req.method !== 'HEAD') {
                    body = await new Promise((resolve) => {
                      const chunks: Buffer[] = [];
                      req.on('data', chunk => chunks.push(chunk));
                      req.on('end', () => resolve(Buffer.concat(chunks)));
                    });
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
        '@/food-merge': path.resolve(__dirname, 'src/components/food-merge'),
        '@/matchmaker': path.resolve(__dirname, 'src/components/matchmaker'),
        '@/memories': path.resolve(__dirname, 'src/components/memories'),
        '@/quiz': path.resolve(__dirname, 'src/components/quiz'),
        '@/ui': path.resolve(__dirname, 'src/components/ui'),
        '@/hooks': path.resolve(__dirname, 'src/hooks'),
        '@/context': path.resolve(__dirname, 'src/context'),
        '@/design-system': path.resolve(__dirname, 'src/design-system'),
        '@/services': path.resolve(__dirname, 'src/services'),
        '@/utils': path.resolve(__dirname, 'src/utils'),
        '@/integrations': path.resolve(__dirname, 'src/integrations'),
        '@': path.resolve(__dirname, 'src'),
      },
    },
  };
});
