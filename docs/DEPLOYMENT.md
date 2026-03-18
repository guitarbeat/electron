# Deploying the app

## Deployment status

The project currently builds successfully with:

- `npm run check-types`
- `npm run build`

## What’s required for `/api` endpoints

- `src/services/gistClient.ts` uses `GIST_API_URL` for shared data persistence.
- `src/services/metadataService.ts` uses `OMDB_BASE` for movie metadata lookups.

At build time, both defaults point to same-origin routes:

- `/api/gist`
- `/api/omdb`

These paths work in development because Vite proxies them in `vite.config.ts`:

- `proxy['/api'] -> http://localhost:3001`

For production, your host must provide the same routes or you must override them with environment variables.

## Deployment options

1. Recommended for full app parity
   - Deploy serverless handlers for `/api/gist` and `/api/omdb`.
   - Vercel is configured to serve these via `/api` functions in this repo (`api/gist.ts`, `api/omdb.ts`).
   - Ensure those routes return the same payload shape currently expected by the app.
2. If your host is static only
   - Use local fallback only by omitting `VITE_GIST_ID`.
   - Set `VITE_GIST_API_URL` and `VITE_OMDB_API_URL` only if your host exposes compatible endpoints.

### Host-specific templates

- `vercel.json` (included) rewrites for SPA fallback:
  - `/(.*)` -> `/index.html`
- `api/gist.ts` + `api/omdb.ts` now provide Vercel serverless proxy handlers for API routes.
- `netlify.toml` (included) rewrites:
  - `/api/*` -> `https://your-backend-host.example.com/api/*`
  - all other routes -> `/index.html`

For Vercel, no external API host is required if you use the included serverless functions.
For Netlify/static-hosting without serverless functions, replace `your-backend-host.example.com` with your API host.

## Environment variables (optional)

- `VITE_GIST_ID`
  - Enables remote shared storage behavior.
  - If absent, the app will fall back to localStorage behavior.
- `VITE_GIST_API_URL`
  - Override `/api/gist` (default).
- `VITE_API_SECRET`
  - Client-side secret used to authenticate write requests to the proxy.
- `VITE_OMDB_API_URL`
  - Override `/api/omdb` (default). For direct OMDb calls, set this to `https://www.omdbapi.com`.
- `VITE_OMDB_API_KEY`
  - Optional key appended only when `VITE_OMDB_API_URL` is an absolute URL.
- `VITE_GOOGLE_PLACES_API_KEY`
  - Required only for map components.
- `GIST_ID`
  - Server-side gist ID used by Vercel proxy.
- `GITHUB_TOKEN`
  - Server-side token used to authenticate write requests to the GitHub Gist API.
- `API_SECRET`
  - Server-side secret used by the Vercel proxy to authenticate write requests from the client. Must match `VITE_API_SECRET`.
- `OMDB_API_URL`
  - Server-side base URL for OMDb proxy when using Vercel.
- `OMDB_API_KEY`
  - Optional API key used by the Vercel OMDb proxy when `OMDB_API_URL` is external.
