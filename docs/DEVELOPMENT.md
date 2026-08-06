# Development & Operations

## Repo Snapshot

- App: collaborative movie-night/watchlist SPA built with React 19, TypeScript, and Vite.
- Package manager: prefer `pnpm`. `pnpm-lock.yaml` is the active lockfile.
- Runtime: Node.js 22.x (`package.json` engines).
- Deploy shape: static frontend plus serverless-style handlers in `api/`.

## Core Commands

```bash
pnpm install
pnpm dev
pnpm verify
pnpm build
pnpm preview
pnpm lint
pnpm check-types
pnpm test
```

Command behavior:

- `pnpm dev`: starts the Vite dev server on `http://localhost:5000`.
- `pnpm verify`: runs the full pre-deploy validation set (`check-types`, `lint`, `test`, `build`).
- `pnpm build`: writes the production bundle to `dist/`.
- `pnpm preview`: serves the built app locally.
- `pnpm lint`: runs `eslint .`.
- `pnpm check-types`: runs `tsc --noEmit`.
- `pnpm test`: runs `node --test src/**/*.test.ts`.

## Recommended Workflow

1. Install dependencies with `pnpm install`.
2. Pull development secrets using `npx vercel env pull .env.local --yes` (or copy `.env.example` to `.env.local` if working offline).
3. Start local development with `pnpm dev`.
4. Before handing work off or deploying to Vercel, run `pnpm verify`.

## App and API Workflow

- There is no separate local backend process. `vite.config.ts` mounts a custom middleware that executes `api/*.ts` for `/api/*` requests during local development.
- `vite.config.ts` loads environment variables from both the workspace root (`.env.local`) and package directory into `process.env`, making database connections and secrets available during `pnpm dev`.
- Shared app data is served from `/api/state/:scope` and `/api/session`, with the core read/mutate logic in `api/_lib/state.ts` and shared persistence in `api/_lib/sharedStateStore.ts` (Neon/Postgres).
- Profile selection and PIN login are handled through signed cookies in `api/session.ts`, `api/session/profile.ts`, and `api/_lib/session.ts`.
- `api/omdb.ts` and `api/tvmaze.ts` are the metadata proxies used in production-style deployments.
- In development, `src/services/metadataService.ts` defaults metadata reads to the local `/api/omdb` and `/api/tvmaze` proxies. Set `VITE_OMDB_API_URL` or `VITE_TVMAZE_API_URL` only when intentionally bypassing those proxies.
- Watchlist autocomplete tries OMDb movie search first, then falls back to TVMaze show search when OMDb has no usable match.
- In local Vite development, `VITE_DATABASE_URL` is accepted as a fallback when `DATABASE_URL` is not set.
- If database configuration is missing, the app falls back to degraded local snapshot/outbox storage and mock seed arrays (`mockMovies`, `mockSuggestions`, `mockMemories`) instead of crashing.

## Environment Variables

Client-side variables used by the app:

- `VITE_DATABASE_URL`
- `VITE_OMDB_API_URL`
- `VITE_OMDB_API_KEY` only when `VITE_OMDB_API_URL` points directly to OMDb
- `VITE_TVMAZE_API_URL`
- `VITE_GOOGLE_PLACES_API_KEY`

Server-side variables used by deployed handlers:

- `DATABASE_URL`
- `DATABASE_URL_UNPOOLED` (optional; for tooling that needs a direct Neon connection)
- `POSTGRES_URL` / `POSTGRES_URL_NON_POOLING` (optional Vercel Postgres-compatible aliases)
- `SESSION_SIGNING_SECRET`
- `OMDB_API_URL`
- `OMDB_API_KEY` for the default `/api/omdb` proxy path
- `TVMAZE_API_URL`
- `ALLOWED_ORIGINS` for `api/omdb.ts` origin allowlisting

Notes:

- `SESSION_SIGNING_SECRET` should be set in any stable shared environment. If it is missing, the server falls back to an ephemeral in-process secret and profile sessions will not survive restarts.
## Validation Expectations

- Add or update `*.test.ts` files when changing service logic, state helpers, or utility behavior.
- Prefer verifying the narrowest surface first, then run the full validation set before finishing:
  `pnpm verify` (or run `pnpm lint`, `pnpm check-types`, `pnpm test`, `pnpm build` individually when narrowing failures).
- CI (GitHub Actions): `.github/workflows/ci.yml` runs the same install, lint, typecheck, test, and build steps on pushes and pull requests to `main`/`master`.

## Deployment Notes

### Vercel (full parity with this repo)

- `vercel.json` routes `/api/*` to serverless handlers under `api/**/*.ts` and sends all other paths to `index.html` for the SPA.
- Canonical Vercel project for this repo: `guitarbeats-projects / electra-and-aaron-movies`  
  Dashboard: `https://vercel.com/guitarbeats-projects/electra-and-aaron-movies`
- Set the same server env vars as in [Environment Variables](#environment-variables) (`DATABASE_URL`, `SESSION_SIGNING_SECRET`, OMDb/TVMaze, etc.) in the Vercel project settings.
- If a local checkout is missing `.vercel/project.json`, run `vercel link --project electra-and-aaron-movies` before using `vercel env pull`.

**Health checks:** `GET /api/health` returns `{ "ok": true, "liveness": true }` without calling Postgres (use for frequent uptime pings). `GET /api/health?deep=1` verifies shared-state rows and reads PIN coverage; use a slow interval only (for example every few minutes), not aggressive polling. After a deploy, hit liveness once to confirm `/api/*` is wired.

**Monitoring:** Use Vercel’s function logs and error rates for `/api/state/*` and related handlers; alert on spikes in 5xx or latency. External uptime tools can target `/api/health` (liveness) and optionally `?deep=1` on a longer interval.

### Netlify (static build only until `/api` is wired)

- `netlify.toml` runs `npm run build` and publishes `dist/`. The SPA fallback `/* → /index.html` matches Vercel’s client routing.
- **`/api/*` is not the repo handlers today**: redirects send `/api/*` to `https://your-backend-host.example.com/api/:splat` (placeholder). Shared state sync, OMDb proxy, and state routes will **not** work until you either:
  - Point that redirect at a real deployment that implements the same routes as `api/*.ts`, or
  - Replace it with [Netlify Functions](https://docs.netlify.com/functions/overview/) (or Edge Functions) that mirror those handlers, or
  - Host the static app on Netlify but configure the client to call a separate API origin (and update CORS / `ALLOWED_ORIGINS` as needed).
- Treat **“works on Vercel”** as the default for API behavior; verify Netlify explicitly before relying on shared persistence or proxies there.

## Source-of-Truth Notes

- Human-oriented overview: `README.md`. Doc index: `docs/README.md`.
- For commands, env vars, and API behavior, prefer `package.json`, `vite.config.ts`, `api/`, and this file.
