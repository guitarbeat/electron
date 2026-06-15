# Project guidelines

Agent-facing conventions for this repo. Human docs: [`docs/README.md`](../docs/README.md) (index), [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md), [`docs/DEVELOPMENT.md`](../docs/DEVELOPMENT.md).

## Overview

Collaborative movie-night app for two people: **React 19**, **TypeScript**, **Vite**, Y2K-inspired UI. Default persistence is **localStorage**; optional **Neon Postgres** sync when `DATABASE_URL` is configured (see [`docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md)).

## Structure

- `src/app/`: Shell (`App.tsx`, `App.scss`), providers, shell state
- `src/components/`: Feature UI (`common`, `effects`, `matchmaker`, `memories`, `messages`, `places`, `quiz`, `spinWheel`, `ui`, `watchlist`, …)
- `src/hooks/`: Shared hooks
- `src/services/`: APIs, storage, polling, metadata
- `src/utils/`: Shared helpers (see `src/utils/index.ts`)
- `src/theme/`: Design tokens
- `api/`: Serverless-style `/api/*` handlers (loaded by Vite in dev, deployed on hosts that support them)
- `docs/`: [Documentation index](../docs/README.md)

## Commands

Use **pnpm** (see root `README.md` and [`docs/DEVELOPMENT.md`](../docs/DEVELOPMENT.md)).

## Conventions

- Prefer extending existing feature files over new one-off modules when the change is small.
- Shared helpers belong in `src/utils/` when multiple features need them.
- Styling: prefer `src/app/App.scss` and co-located SCSS where the project already uses it.
