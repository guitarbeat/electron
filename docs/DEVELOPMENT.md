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

- `pnpm dev`: starts the Vite dev server on `http://localhost:5173` (use the Network URL from the terminal for phone testing).
- `pnpm verify`: runs the full pre-deploy validation set (`check-types`, `lint`, `test`, `build`).
- `pnpm build`: writes the production bundle to `dist/`.
- `pnpm preview`: serves the built app locally.
- `pnpm lint`: runs `eslint .`.
- `pnpm check-types`: runs `tsc --noEmit`.
- `pnpm test`: runs `node --test src/**/*.test.ts`.

## Recommended Workflow

1. Install dependencies with `pnpm install`.
2. Copy `.env.example` to `.env.local` when working with remote sync or external APIs.
3. Start local development with `pnpm dev`.
4. Before handing work off or deploying to Vercel, run `pnpm verify`.

## App and API Workflow

- There is no separate local backend process. `vite.config.ts` mounts a custom middleware that executes `api/*.ts` for `/api/*` requests during local development.
- Shared app data is served from `/api/state/:scope` and `/api/session`, with the core read/mutate logic in `api/_lib/state.ts` and shared persistence in `api/_lib/sharedStateStore.ts` (Neon/Postgres).
- Profile selection and PIN login are handled through signed cookies in `api/session.ts`, `api/session/profile.ts`, and `api/_lib/session.ts`.
- `api/omdb.ts` and `api/tvmaze.ts` are the metadata proxies used in production-style deployments.
- In development, `src/services/metadataService.ts` defaults metadata reads to the local `/api/omdb` and `/api/tvmaze` proxies. Set `VITE_OMDB_API_URL` or `VITE_TVMAZE_API_URL` only when intentionally bypassing those proxies.
- Watchlist autocomplete tries OMDb movie search first, then falls back to TVMaze show search when OMDb has no usable match.
- In local Vite development, `VITE_DATABASE_URL` is accepted as a fallback when `DATABASE_URL` is not set.
- If database configuration is missing, the app falls back to degraded local snapshot/outbox storage instead of shared persistence.

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

## Deployment

Hosting, env vars, health checks, and Vercel/Netlify notes: [`DEPLOYMENT.md`](DEPLOYMENT.md).

## Source-of-Truth Notes

- Human-oriented overview: `README.md`. Doc index: `docs/README.md`.
- For commands, env vars, and API behavior, prefer `package.json`, `vite.config.ts`, `api/`, and this file.
