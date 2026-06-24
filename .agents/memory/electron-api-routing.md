---
name: Electron artifact API routing
description: The electron app serves its own /api/* routes via Vite SSR middleware; the api-server artifact must not claim the /api path or all API calls will 502.
---

# Rule
The electron artifact's Vite config (`vite.config.ts`) has an `api-proxy` plugin that intercepts `/api/*` requests via `server.middlewares.use()` and SSR-loads the handler files from `artifacts/electron/api/`. The artifact.toml must include `/api` in the electron service's `paths` array.

**Why:** When the `api-server` artifact claims the `/api` path at port 8080, all `/api` requests from the Replit reverse proxy go to port 8080 (which is not running), causing 502 errors. The electron Vite server (port 25729) handles the API natively.

**How to apply:** In `artifacts/electron/.replit-artifact/artifact.toml`, ensure `paths = ["/", "/api"]` under `[[services]]`. In `artifacts/api-server/.replit-artifact/artifact.toml`, use a different path like `/api-server` so it doesn't conflict.

Also required: `pg` must be installed as a dependency in the electron artifact since `api/_lib/sharedStateStore.ts` imports it for PostgreSQL access.
