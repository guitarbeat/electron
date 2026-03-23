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

For **static-only** hosting, omit Gist-related env vars; the app falls back to `localStorage`.

## Environment variables

### Client (`VITE_*`)

| Variable | Purpose |
| --- | --- |
| `VITE_GIST_ID` | Enables shared Gist storage (optional) |
| `VITE_GIST_API_URL` | Override default `/api/gist` |
| `VITE_API_SECRET` | Must match server `API_SECRET` for authorized writes |
| `VITE_OMDB_API_URL` | Override default `/api/omdb` |
| `VITE_OMDB_API_KEY` | OMDb key if calling OMDb directly from the client |
| `VITE_GOOGLE_PLACES_API_KEY` | Map / Places features |

### Server / serverless (deployed handlers)

| Variable | Purpose |
| --- | --- |
| `GIST_ID` | Gist id for shared state |
| `GITHUB_TOKEN` | GitHub token for Gist API |
| `API_SECRET` | Authorizes client writes; must match `VITE_API_SECRET` |
| `SESSION_SIGNING_SECRET` | Session cookies and PIN-related auth (`api/_lib/session.ts`) |
| `OMDB_API_URL` | Base URL for OMDb proxy |
| `OMDB_API_KEY` | OMDb API key for proxy |
| `ALLOWED_ORIGINS` | Origin allowlist for `api/omdb.ts` where applicable |

## Host notes

- **Vercel**: `vercel.json` — `/api/*` → handlers, other routes → `index.html` SPA fallback
- **Netlify**: `netlify.toml` builds the app; `/api/*` must target a real backend unless you add compatible functions — see `DEVELOPMENT.md`
