---
name: Electron App Migration
description: How the Electron collaborative movie watchlist app was migrated into the pnpm workspace
---

> **Historical:** describes the Replit `artifacts/` workspace layout. The app now runs from repo-root `src/` and `api/` (`pnpm dev`). See [`docs/archive/HISTORY.md`](../../docs/archive/HISTORY.md) and [MEMORY.md](MEMORY.md).

## Structure (Replit-era mirror)
- Frontend: `artifacts/electron/` — React+Vite app, previewPath `/`, port 25729
- API: `artifacts/api-server/` — Express 5, port 8080, previewPath `/api-server`
- Vite proxy: `/api` → `http://localhost:8080` (in `artifacts/electron/vite.config.ts`)
- API router mounted at `/api` in `artifacts/api-server/src/app.ts`

## Key Decisions
- Vite config has path aliases: `@/shared`, `@/services`, `@/theme`, etc. all pointing into `artifacts/electron/src/`
- API handlers copied from `.migration-backup/api/` into `artifacts/api-server/src/electron-api/handlers/`
- API lib files in `artifacts/api-server/src/electron-api/lib/`
- Shared src files (types, utils, services, components) copied into `artifacts/api-server/src/electron-api/src/`
- `lit` package required by `@khmyznikov/pwa-install` — installed as devDep in electron artifact
- `pg` and `zod` installed in api-server for the state/session handlers

**Why:** esbuild bundles everything into one file; it cannot resolve imports that cross workspace package boundaries, so all shared code must be physically present within the api-server src tree.
