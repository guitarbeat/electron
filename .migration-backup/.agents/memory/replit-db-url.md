---
name: Replit DATABASE_URL conflict
description: Replit injects DATABASE_URL as a runtime-managed secret that shadows external DB credentials; fix is NEON_DATABASE_URL.
---

# Replit DATABASE_URL conflict

Replit reserves `DATABASE_URL` as a runtime-managed secret. It cannot be set or overridden via `setEnvVars`. If the project uses an external Postgres (e.g. Neon), this Replit-injected value silently takes priority and the app reads from the wrong (empty) database.

**Why:** `getDatabaseUrl()` in `sharedStateStore.ts` checks `process.env.DATABASE_URL` first. Replit's injected value wins even if it points to a different/empty DB.

**How to apply:** Use `NEON_DATABASE_URL` (or another project-specific name not managed by Replit) as the highest-priority check in `getDatabaseUrl()`. Set it via `setEnvVars` in the shared environment. The fixed priority order is:

```ts
process.env.NEON_DATABASE_URL ||
process.env.POSTGRES_URL ||
process.env.POSTGRES_PRISMA_URL ||
process.env.VITE_DATABASE_URL ||
process.env.DATABASE_URL
```

Also: `POSTGRES_URL` is safe to set via `setEnvVars` (not runtime-managed). `OMDB_API_KEY` and `VITE_OMDB_API_KEY` are also safe to set this way.
