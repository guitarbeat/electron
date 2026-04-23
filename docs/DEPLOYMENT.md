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
- **Shared sync/auth**: `/api/session` plus `/api/state/:scope`, backed by GitHub Gist storage when configured

For **static-only** hosting, omit Gist-related env vars; the app falls back to `localStorage`.

## Environment variables

### Client (`VITE_*`)

| Variable | Purpose |
| --- | --- |
| `VITE_GIST_ID` | Local Vite-development fallback for the shared Gist id |
| `VITE_OMDB_API_URL` | Override default `/api/omdb` only when intentionally bypassing the proxy |
| `VITE_OMDB_API_KEY` | Optional client OMDb key when `VITE_OMDB_API_URL` points directly at OMDb |
| `VITE_TVMAZE_API_URL` | Override default `/api/tvmaze` or the public TVMaze API |
| `VITE_GOOGLE_PLACES_API_KEY` | Map / Places features |

### Server / serverless (deployed handlers)

| Variable | Purpose |
| --- | --- |
| `GIST_ID` | Gist id for shared state |
| `GITHUB_TOKEN` | GitHub token for Gist API writes (`GITHUB_PERSONAL_ACCESS_TOKEN` and `GH_TOKEN` are fallback names) |
| `SESSION_SIGNING_SECRET` | Session cookies and PIN-related auth (`api/_lib/session.ts`) |
| `OMDB_API_URL` | Base URL for OMDb proxy |
| `OMDB_API_KEY` | Required OMDb API key for the default `/api/omdb` proxy |
| `TVMAZE_API_URL` | Base URL for TVMaze proxy |
| `ALLOWED_ORIGINS` | Origin allowlist for `api/omdb.ts` where applicable |

`SESSION_SIGNING_SECRET` should always be set for deployed/shared environments; otherwise profile cookies fall back to a process-local secret and will be invalidated on restarts.

Watchlist autocomplete uses OMDb movie search first and falls back to TVMaze show search when OMDb has no usable result.

## Host notes

- **Vercel**: `vercel.json` — `/api/*` → handlers, other routes → `index.html` SPA fallback  
  Canonical project: `guitarbeats-projects / electra-and-aaron-movies`  
  Dashboard: `https://vercel.com/guitarbeats-projects/electra-and-aaron-movies`  
  If a local checkout is not linked, run `vercel link --project electra-and-aaron-movies` before `vercel env pull`
- **Netlify**: `netlify.toml` builds the app; `/api/*` must target a real backend unless you add compatible functions — see `DEVELOPMENT.md`
