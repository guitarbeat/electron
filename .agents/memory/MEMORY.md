# Agent memory index

**Canonical source tree:** root `src/`, `api/`, `vite.config.ts` — run with `pnpm dev` from repo root. See [`docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md).

Historical Replit workspace layout (`artifacts/electron/`, `artifacts/api-server/`) is documented in [electron-migration.md](electron-migration.md) and [`docs/HISTORY.md`](../../docs/HISTORY.md). Prefer root `src/` for new work unless a note explicitly says otherwise.

Durable decisions graduate to [`docs/decisions/`](../../docs/decisions/README.md).

## Entries

- [Electron App Migration](electron-migration.md) — Replit-era workspace layout and api-server bundling constraints
- [API Cross-Package Bundling](api-cross-package.md) — api-server needs copies of frontend src files inside its own src tree; esbuild can't cross artifact boundaries
- [Replit DATABASE_URL conflict](replit-db-url.md) — Replit reserves DATABASE_URL as a runtime-managed secret; use NEON_DATABASE_URL (highest priority) instead
- [Concurrent map testing](bolt.md) — use hung promises to assert max concurrent tasks in concurrentMap tests
- [Redundant ARIA labels](aria-labels.md) — skip aria-label on buttons that already have visible text; reserve for icon-only controls
