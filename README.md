# Collaborative movie night

A two-person movie watchlist and shared space built with **React 19**, **TypeScript**, and **Vite**, with a nostalgic Y2K-inspired UI (gel bubbles, dashboard chrome, chat-style surfaces).

Persistence defaults to **localStorage**, with optional **GitHub Gist** sync when configured.

## Quick start

```bash
pnpm install
pnpm dev
```

Dev server: `http://localhost:5000`. API routes under `/api/*` are handled by Vite dev middleware (see `vite.config.ts` and `api/`).

```bash
pnpm build
pnpm preview
pnpm lint
pnpm check-types
pnpm test
```

## Documentation

- **[docs/README.md](docs/README.md)** — index of guides (deployment, site layout, history)
- **[DEVELOPMENT.md](DEVELOPMENT.md)** — toolchain, env vars, and workflow

## Tech stack

- **UI**: React, SCSS (`src/app/App.scss`), design tokens in `src/theme/`
- **Data**: `localStorage` / Gist via `src/services/` and `api/gist.ts`
- **Metadata**: OMDb (`api/omdb.ts`, `src/services/metadataService.ts`)
- **Places**: Google Places (map components) when `VITE_GOOGLE_PLACES_API_KEY` is set
