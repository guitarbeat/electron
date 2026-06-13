# Collaborative Movie Watchlist

A two-person movie watchlist and shared space built with **React 19**, **TypeScript**, and **Vite**, with a nostalgic Y2K-inspired UI (gel bubbles, dashboard chrome, chat-style surfaces).

## Project Status

- **Project Type**: React + TypeScript + Vite
- **Package Manager**: pnpm
- **Entry Point**: `src/main.tsx`
- **Build System**: Vite 8.0.10
- **Styling**: SCSS + CSS Modules
- **State Management**: Shared state via `/api/session` and `/api/state/*`

## Quick Start

```bash
pnpm install
pnpm dev
```

Dev server: `http://localhost:5000`. API routes under `/api/*` are handled by Vite dev middleware.

## Available Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm preview      # Preview production build
pnpm lint         # Run ESLint
pnpm check-types  # TypeScript type checking
pnpm test         # Run tests
pnpm verify       # Full validation (types + lint + test + build)
```

## Architecture

- **UI**: React 19, SCSS, design tokens in `src/theme/`
- **Data**: Shared-state sync via `src/services/stateClient.ts`, `api/session.ts`, `api/state/*`
- **Metadata**: OMDb API (`api/omdb.ts`, `src/services/metadataService.ts`)
- **Places**: Google Places map components (when `VITE_GOOGLE_PLACES_API_KEY` is set)
- **Storage**: Neon Postgres when `DATABASE_URL` configured, otherwise local snapshot/outbox

## Environment Variables

See `.env.example` for required variables. Key ones:
- `DATABASE_URL` — Neon Postgres connection string
- `VITE_GOOGLE_PLACES_API_KEY` — Google Places API key
- `OMDB_API_KEY` — OMDb API key

## Tech Stack

- React 19, TypeScript, Vite 8, SCSS
- Three.js / OGL (3D graphics)
- MapLibre GL (maps)
- GSAP / Motion (animations)
- Zustand-style state patterns
- Zod (validation)
