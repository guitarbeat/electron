# Deployment and local development

## Local development

Use **pnpm** (see `package.json` and `DEVELOPMENT.md`).

```bash
pnpm install
pnpm dev
```

- Dev app: `http://localhost:5000`
- `/api/*` requests are served in dev by Vite middleware that loads handlers from `api/` (no separate backend process)

```bash
pnpm check-types
pnpm build
pnpm preview
```

## Production shape

- **Frontend**: static build from `pnpm build` (`dist/`)
- **API**: serverless-style handlers in `api/` (e.g. Vercel: `vercel.json` rewrites `/api/*` to those modules)
- **Shared sync/auth**: `/api/session` plus `/api/state/:scope`, backed by Upstash Redis (REST) when configured

For **static-only** hosting, omit Upstash-related env vars; the app falls back to `localStorage`.

## Environment variables

### Client (`VITE_*`)

| Variable | Purpose |
| --- | --- |
| `VITE_UPSTASH_REDIS_REST_URL` | Local Vite-development fallback for the Upstash REST base URL |
| `VITE_UPSTASH_REDIS_REST_TOKEN` | Local Vite-development fallback for the Upstash REST token |
| `VITE_OMDB_API_URL` | Override default `/api/omdb` only when intentionally bypassing the proxy |
| `VITE_OMDB_API_KEY` | Optional client OMDb key when `VITE_OMDB_API_URL` points directly at OMDb |
| `VITE_TVMAZE_API_URL` | Override default `/api/tvmaze` or the public TVMaze API |
| `VITE_GOOGLE_PLACES_API_KEY` | Map / Places features |

### Server / serverless (deployed handlers)

| Variable | Purpose |
| --- | --- |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis HTTPS REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST token (use the standard token for writes; read-only tokens cannot run `KEYS`) |
| `UPSTASH_STATE_KEY_PREFIX` | Optional Redis key prefix for state blobs (default `app:state:`) |
| `SESSION_SIGNING_SECRET` | Session cookies and PIN-related auth (`api/_lib/session.ts`) |
| `OMDB_API_URL` | Base URL for OMDb proxy |
| `OMDB_API_KEY` | Required OMDb API key for the default `/api/omdb` proxy |
| `TVMAZE_API_URL` | Base URL for TVMaze proxy |
| `ALLOWED_ORIGINS` | Origin allowlist for `api/omdb.ts` where applicable |

`SESSION_SIGNING_SECRET` should always be set for deployed/shared environments; otherwise profile cookies fall back to a process-local secret and will be invalidated on restarts.

Watchlist autocomplete uses OMDb movie search first and falls back to TVMaze show search when OMDb has no usable result.

### Migrating from GitHub Gist

Older deployments stored each scope as a file inside one GitHub Gist. This app no longer reads from Gist. To move data over, copy each JSON file’s **content** (not the Gist wrapper) into a Redis string at key `app:state:<filename>` — for example `app:state:movielist.json` — using your Upstash console, `redis-cli`, or a one-off script. Then set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` on the server.

## Host notes

- **Vercel**: `vercel.json` — `/api/*` → handlers, other routes → `index.html` SPA fallback  
  Canonical project: `guitarbeats-projects / electra-and-aaron-movies`  
  Dashboard: `https://vercel.com/guitarbeats-projects/electra-and-aaron-movies`  
  If a local checkout is not linked, run `vercel link --project electra-and-aaron-movies` before `vercel env pull`
- **Netlify**: `netlify.toml` builds the app; `/api/*` must target a real backend unless you add compatible functions — see `DEVELOPMENT.md`
