# Collaborative movie night

A two-person movie watchlist and shared space built with **React 19**, **TypeScript**, and **Vite**, with a nostalgic Y2K-inspired UI (gel bubbles, dashboard chrome, chat-style surfaces).

Shared state flows through `/api/session` and `/api/state/*`. When `DATABASE_URL` is configured, those handlers persist the watchlist, suggestions, spin state, and profile PIN data to **Neon Postgres**; otherwise the app degrades to local snapshot/outbox storage so development still works.

## Quick start

```bash
pnpm install
pnpm dev
```

Dev server: `http://localhost:5000`. API routes under `/api/*` are handled by Vite dev middleware (see `vite.config.ts` and `api/`).

```bash
pnpm verify
pnpm build
pnpm preview
pnpm lint
pnpm check-types
pnpm test
```

Run `pnpm verify` before a Vercel deploy to execute the full local validation set in one command.

## Documentation

- **[docs/README.md](docs/README.md)** — index of guides (architecture, development, deployment)
- **[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)** — toolchain, env vars, and workflow
- **[AGENTS.md](AGENTS.md)** — AI agent entry point → [`.agents/README.md`](.agents/README.md) for skills, memory, and conventions

## Tech stack

- **UI**: React, SCSS (`src/app/App.scss`), design tokens in `src/theme/`
- **Data**: typed shared-state sync in `src/services/stateClient.ts`, `api/session.ts`, and `api/state/*`
- **Metadata**: OMDb (`api/omdb.ts`, `src/services/metadataService.ts`)
- **Places**: Google Places (map components) when `VITE_GOOGLE_PLACES_API_KEY` is set
