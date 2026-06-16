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
pnpm bootstrap:state   # seed missing Neon shared_state_files rows
```

## Production shape

- **Frontend**: static build from `pnpm build` (`dist/`)
- **API**: serverless-style handlers in `api/` (e.g. Vercel: `vercel.json` rewrites `/api/*` to those modules)
- **Shared sync/auth**: `/api/session` plus `/api/state/:scope`, backed by Neon Postgres when configured

For **static-only** hosting, omit database env vars; the app falls back to `localStorage`.

## Environment variables

### Client (`VITE_*`)

| Variable | Purpose |
| --- | --- |
| `VITE_DATABASE_URL` | Local Vite-development fallback for the Neon/Postgres connection string |
| `VITE_OMDB_API_URL` | Override default `/api/omdb` only when intentionally bypassing the proxy |
| `VITE_OMDB_API_KEY` | Optional client OMDb key when `VITE_OMDB_API_URL` points directly at OMDb |
| `VITE_TVMAZE_API_URL` | Override default `/api/tvmaze` or the public TVMaze API |
| `VITE_GOOGLE_PLACES_API_KEY` | Map / Places features |

### Server / serverless (deployed handlers)

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon pooled Postgres connection string |
| `DATABASE_URL_UNPOOLED` | Optional direct Neon connection string for maintenance scripts |
| `POSTGRES_URL` | Optional Vercel Postgres-compatible alias for `DATABASE_URL` |
| `SESSION_SIGNING_SECRET` | Session cookies and PIN-related auth (`api/_lib/session.ts`) |
| `OMDB_API_URL` | Base URL for OMDb proxy |
| `OMDB_API_KEY` | Required OMDb API key for the default `/api/omdb` proxy |
| `TVMAZE_API_URL` | Base URL for TVMaze proxy |
| `ALLOWED_ORIGINS` | Origin allowlist for `api/omdb.ts` where applicable |

`SESSION_SIGNING_SECRET` should always be set for deployed/shared environments; otherwise profile cookies fall back to a process-local secret and will be invalidated on restarts.

Watchlist autocomplete uses OMDb movie search first and falls back to TVMaze show search when OMDb has no usable result.

Filenames must match the server scopes (for example `movielist.json` for the watchlist). Use `pnpm bootstrap:state` to seed missing rows when Neon is empty.

## Host notes

- **Vercel**: `vercel.json` — `/api/*` → handlers, other routes → `index.html` SPA fallback  
  Canonical project: `guitarbeats-projects / electra-and-aaron-movies`  
  Dashboard: `https://vercel.com/guitarbeats-projects/electra-and-aaron-movies`  
  If a local checkout is not linked, run `vercel link --project electra-and-aaron-movies` before `vercel env pull`
- **Health checks:** `GET /api/health` returns `{ "ok": true, "liveness": true }` without calling Postgres (use for frequent uptime pings). `GET /api/health?deep=1` verifies shared-state rows and PIN coverage — use a slow interval only (e.g. every few minutes), not aggressive polling. After a deploy, hit liveness once to confirm `/api/*` is wired.
- **Monitoring:** Use Vercel function logs and error rates for `/api/state/*`; alert on 5xx spikes or latency. External uptime tools can target `/api/health` and optionally `?deep=1` on a longer interval.
- **Netlify**: copy [`examples/netlify.toml.example`](examples/netlify.toml.example) to the repo root as `netlify.toml`; `/api/*` must target a real backend unless you add compatible functions — see `DEVELOPMENT.md`

## Vercel best practices

- Treat Vercel Functions as stateless + ephemeral (no durable RAM/FS, no background daemons); use Blob or marketplace integrations for preserving state
- Edge Functions (standalone) are deprecated; prefer Vercel Functions
- Don't start new projects on Vercel KV/Postgres (both discontinued); use Marketplace Redis/Postgres instead
- Store secrets in Vercel env variables, not in git or `NEXT_PUBLIC_*`
- Provision Marketplace native integrations with `vercel integration add` (CI/agent-friendly)
- Sync env + project settings with `vercel env pull` / `vercel pull` when you need local/offline parity
- Use `waitUntil` for post-response work; avoid the deprecated Function `context` parameter
- Set Function regions near your primary data source; avoid cross-region DB/service roundtrips
- Tune Fluid Compute knobs (e.g., `maxDuration`, memory/CPU) for long I/O-heavy calls
- Use Runtime Cache for fast **regional** caching + tag invalidation (don't treat it as global KV)
- Use Cron Jobs for schedules; cron runs in UTC and triggers your production URL via HTTP GET
- Use Vercel Blob for uploads/media; Edge Config for small, globally-read config
- If Deployment Protection is enabled, use a bypass secret to access protected previews
- Add OpenTelemetry via `@vercel/otel` on Node; don't expect OTEL support on the Edge runtime
- Enable Web Analytics + Speed Insights early
- Use AI Gateway for model routing (`AI_GATEWAY_API_KEY`); curl `https://ai-gateway.vercel.sh/v1/models` for current model IDs
- For durable agent loops or untrusted code: use Workflow (pause/resume/state) + Sandbox; use Vercel MCP for secure infra access
