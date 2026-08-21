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
| `AGENT_API_TOKEN` | Shared server-only bearer token for private Agent API reads and actions |
| `OMDB_API_URL` | Base URL for OMDb proxy |
| `OMDB_API_KEY` | Required OMDb API key for the default `/api/omdb` proxy |
| `TVMAZE_API_URL` | Base URL for TVMaze proxy |
| `ALLOWED_ORIGINS` | Origin allowlist for `api/omdb.ts` where applicable |

`SESSION_SIGNING_SECRET` should always be set for deployed/shared environments; otherwise profile cookies fall back to a process-local secret and will be invalidated on restarts.

Watchlist autocomplete uses OMDb movie search first and falls back to TVMaze show search when OMDb has no usable result.

### Migrating from GitHub Gist or Redis

Older deployments stored each scope as either one GitHub Gist file or one Redis string. This app stores each scope as a row in `shared_state_files` with `filename` and `content` columns. To move data over:

1. Set `DATABASE_URL` on the server.
2. Keep `GIST_ID` and `GITHUB_TOKEN` configured temporarily — the API auto-imports each scope from Gist when Neon is empty or only has an empty bootstrap row (for example `movielist.json` with `[]`).
3. Or run `node scripts/migrate-gist-to-neon.mjs` once to copy every Gist file in bulk.

Filenames must match the server scopes (for example `movielist.json` for the watchlist).

## Host notes

- **Vercel**: `vercel.json` — `/api/*` → handlers, other routes → `index.html` SPA fallback  
  Canonical project: `guitarbeats-projects / electra-and-aaron-movies`  
  Dashboard: `https://vercel.com/guitarbeats-projects/electra-and-aaron-movies`  
  If a local checkout is not linked, run `vercel link --project electra-and-aaron-movies` before `vercel env pull`
- **Netlify**: `netlify.toml` builds the app; `/api/*` must target a real backend unless you add compatible functions — see `DEVELOPMENT.md`

## Quick deploy checklist

After a fresh clone or when setting up a new Vercel deployment:

1. Set `DATABASE_URL`, `SESSION_SIGNING_SECRET`, `AGENT_API_TOKEN`, and `OMDB_API_KEY` in Vercel project settings (Settings > Environment Variables)
2. Optionally set `TVMAZE_API_URL` and `ALLOWED_ORIGINS`
3. Trigger a redeployment (`vercel deploy --prod` or push a commit)

Aliases accepted by the code: `POSTGRES_URL` or `POSTGRES_PRISMA_URL` work in place of `DATABASE_URL`; `SESSION_SECRET` works in place of `SESSION_SIGNING_SECRET`.
