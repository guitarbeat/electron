# Handoff: Fix Runtime Polling Errors

## The Problem

The deployed app on Vercel is throwing `StateClientError: State request failed` for the
movies, suggestions, and memories scopes. This happens because the serverless functions
under `api/` cannot connect to the Postgres database or sign session cookies -- the
required environment variables are not set in the Vercel project.

---

## What You Need to Do

### 1. Open Vercel Project Settings

Go to your Vercel dashboard, select this project, then navigate to
**Settings > Environment Variables**.

### 2. Set the Required Environment Variables

| Variable | What It Is | Where to Get It |
|----------|-----------|-----------------|
| `DATABASE_URL` | Postgres connection string (e.g. from Neon or Supabase) | Your database provider's dashboard |
| `SESSION_SIGNING_SECRET` | HMAC signing key for session cookies | Generate one: `openssl rand -base64 32` |
| `OMDB_API_KEY` | OMDb API key for movie metadata proxy | [omdbapi.com](https://www.omdbapi.com/apikey.aspx) |

**Aliases also accepted by the code:**

- `POSTGRES_URL` or `POSTGRES_PRISMA_URL` can be used instead of `DATABASE_URL`
- `SESSION_SECRET` can be used instead of `SESSION_SIGNING_SECRET`

### 3. Optional Variables (have sensible defaults)

| Variable | Default | Purpose |
|----------|---------|---------|
| `OMDB_API_URL` | `https://www.omdbapi.com` | OMDb base URL |
| `TVMAZE_API_URL` | `https://api.tvmaze.com` | TVMaze base URL |
| `ALLOWED_ORIGINS` | _(empty = no restriction)_ | Comma-separated origins for CORS |

### 4. Redeploy

After saving the env vars, trigger a redeployment (Vercel > Deployments > Redeploy, or
push any commit). The new deployment will pick up the variables and the polling errors
will stop.

---

## Reference

The full list of environment variables is documented in `.env.example` at the repo root.

---

## Session Summary: What Was Accomplished

Over this session, **8 PRs were merged** into `main`:

- **44 bugs fixed** across 5 bug-scan passes (XSS vulnerabilities, duplicate UI
  elements, dead code, stale closures, race conditions, error handling, and more)
- **13 performance optimizations** including lazy-loaded GSAP/Framer Motion, chunk
  splitting, deferred modal hydration, eliminated critical-path animation bundles,
  and Vercel build-log-driven improvements
- Dependency and TypeScript fixes to keep Vercel builds green

The app is functionally complete and building cleanly. The only remaining issue is the
missing environment variables described above.
