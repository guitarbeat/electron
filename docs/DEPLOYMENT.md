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
| `VITE_OMDB_API_URL` | Override default `/api/omdb` |
| `VITE_OMDB_API_KEY` | OMDb key if calling OMDb directly from the client |
| `VITE_TVMAZE_API_URL` | Override default `/api/tvmaze` or the public TVMaze API |
| `VITE_GOOGLE_PLACES_API_KEY` | Map / Places features |

### Server / serverless (deployed handlers)

| Variable | Purpose |
| --- | --- |
| `GIST_ID` | Gist id for shared state |
| `GITHUB_TOKEN` | GitHub token for Gist API writes (`GITHUB_PERSONAL_ACCESS_TOKEN` and `GH_TOKEN` are fallback names) |
| `SESSION_SIGNING_SECRET` | Session cookies and PIN-related auth (`api/_lib/session.ts`) |
| `OMDB_API_URL` | Base URL for OMDb proxy |
| `OMDB_API_KEY` | OMDb API key for proxy |
| `TVMAZE_API_URL` | Base URL for TVMaze proxy |
| `ALLOWED_ORIGINS` | Origin allowlist for `api/omdb.ts` where applicable |

`SESSION_SIGNING_SECRET` should always be set for deployed/shared environments; otherwise profile cookies fall back to a process-local secret and will be invalidated on restarts.

## Host notes

- **Vercel**: `vercel.json` — `/api/*` → handlers, other routes → `index.html` SPA fallback
- **Deprecated route**: `/api/gist` is retained only as a `410 Gone` compatibility endpoint and should not be used for new clients or docs
- **Netlify**: `netlify.toml` builds the app; `/api/*` must target a real backend unless you add compatible functions — see `DEVELOPMENT.md`
