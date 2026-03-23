# AGENTS.md

## Repo Snapshot

- App: collaborative movie-night/watchlist SPA built with React 19, TypeScript, and Vite.
- Package manager: prefer `pnpm`. `pnpm-lock.yaml` is the active lockfile.
- Runtime: Node.js 22.x (`package.json` engines).
- Deploy shape: static frontend plus serverless-style handlers in `api/`.

## Core Commands

```bash
pnpm install
pnpm dev
pnpm build
pnpm preview
pnpm lint
pnpm check-types
pnpm test
```

Command behavior:

- `pnpm dev`: starts the Vite dev server on `http://localhost:5000`.
- `pnpm build`: writes the production bundle to `dist/`.
- `pnpm preview`: serves the built app locally.
- `pnpm lint`: runs `eslint .`.
- `pnpm check-types`: runs `tsc --noEmit`.
- `pnpm test`: runs `node --test src/**/*.test.ts`.

## Recommended Workflow

1. Install dependencies with `pnpm install`.
2. Copy `.env.example` to `.env.local` when working with remote sync or external APIs.
3. Start local development with `pnpm dev`.
4. Before handing work off, run `pnpm lint`, `pnpm check-types`, `pnpm test`, and `pnpm build`.

## App and API Workflow

- There is no separate local backend process. `vite.config.ts` mounts a custom middleware that executes `api/*.ts` for `/api/*` requests during local development.
- `api/gist.ts` is the server-side proxy for shared Gist persistence.
- `api/omdb.ts` is the server-side OMDb proxy used in production-style deployments.
- In development, `src/services/metadataService.ts` defaults OMDb reads to `https://www.omdbapi.com` unless `VITE_OMDB_API_URL` is set.
- In development and production, `src/services/gistClient.ts` defaults shared persistence to `/api/gist`.
- If Gist configuration is missing or write auth is unavailable, the app falls back to `localStorage`.

## Environment Variables

Client-side variables used by the app:

- `VITE_GIST_ID`
- `VITE_GIST_API_URL`
- `VITE_API_SECRET`
- `VITE_OMDB_API_URL`
- `VITE_OMDB_API_KEY`
- `VITE_GOOGLE_PLACES_API_KEY`

Server-side variables used by deployed handlers:

- `GIST_ID`
- `GITHUB_TOKEN`
- `API_SECRET`
- `OMDB_API_URL`
- `OMDB_API_KEY`
- `ALLOWED_ORIGINS` for `api/omdb.ts` origin allowlisting

## Validation Expectations

- Add or update `*.test.ts` files when changing service logic, state helpers, or utility behavior.
- Prefer verifying the narrowest surface first, then run the full validation set before finishing:
  `pnpm lint`, `pnpm check-types`, `pnpm test`, `pnpm build`.

## Deployment Notes

- `vercel.json` rewrites `/api/*` to the local `api/` handlers and falls back other routes to `index.html`.
- `netlify.toml` builds the app but currently rewrites `/api/*` to a placeholder external backend host. Do not assume Netlify has serverless parity without configuring a real backend target.

## Source-of-Truth Notes

- Human-oriented overview: `README.md`. Doc index: `docs/README.md`.
- For commands, env vars, and API behavior, prefer `package.json`, `vite.config.ts`, `api/`, and this file.
