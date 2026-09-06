# Development & Operational Guide

## 1. Local Environment Setup

### 1.1. Prerequisites & Toolchain
- **Node.js**: >= 20.x (`22.x LTS` strongly recommended).
- **Package Manager**: `pnpm@11.24.0` (see root `package.json` `packageManager`). The root `pnpm-lock.yaml` is the canonical lockfile.
- **Git**: Configured for standard Git workflows.

### 1.2. Initial Repository Setup
```bash
# Clone the repository
git clone https://github.com/guitarbeat/electron.git
cd electron

# Install all workspace dependencies
pnpm install

# Setup local environment variables
cp .env.example .env.local
```

---

## 2. Core Command Reference

The project provides a consolidated set of scripts defined in `package.json`:

```bash
# Start local development server with API proxy middleware (http://localhost:5000)
pnpm dev

# Execute the complete pre-deploy validation suite (hygiene + types + lint + test + build)
pnpm verify

# Run automated repo hygiene & artifact lifecycle check
pnpm check-hygiene

# Build optimized production assets to dist/
pnpm build

# Serve production build locally for smoke testing
pnpm preview

# Run ESLint flat configuration across all packages
pnpm lint

# Run strict TypeScript compiler verification across libs, api, and web
pnpm check-types

# Run unit and integration tests via Node.js native test runner
pnpm test
```

### Command Behavior Matrix

| Command | Target Scope | Output / Action | Failure Exit Criteria |
| :--- | :--- | :--- | :--- |
| `pnpm dev` | `apps/web` + `api/` | Runs Vite dev server on port `5000` with local middleware for `/api/*`. | Server crash or unhandled runtime exception. |
| `pnpm check-types` | `libs/`, `api/`, `apps/web/` | Runs `tsc --noEmit` across all project targets. | Any TypeScript type or import error. |
| `pnpm lint` | Root + `apps/web/src` | Executes ESLint 9 Flat Config with React, JSX a11y, and TS rules. | Any rule marked with `error` severity. |
| `pnpm test` | `apps/web/src/**/*.test.ts` | Executes Node.js native test runner (`node --test`). | Any failed test assertion. |
| `pnpm check-hygiene` | Monorepo Root | Validates root directory boundaries and artifact lifecycle rules. | Any unapproved root artifact or temporary scratchpad script. |
| `pnpm verify` | Entire Monorepo | Sequentially runs `check-hygiene` ➔ `check-types` ➔ `lint` ➔ `test` ➔ `build`. | Any step in the chain returning non-zero exit code. |

---

## 3. Local API Proxy & Architecture in Dev

Unlike traditional full-stack setups that require starting two separate processes (e.g. Next.js + Express), this project uses a custom **Vite Dev Server Middleware**:

```
 ┌─────────────────────────────────────────────────────────────┐
 │               Vite Dev Server (Port 5000)                   │
 │                                                             │
 │   ┌───────────────────────┐       ┌─────────────────────┐   │
 │   │ Browser SPA Requests  │       │ /api/* Requests     │   │
 │   │ (HTML, TSX, CSS, OGL) │       │ (Session, State)    │   │
 │   └──────────┬────────────┘       └──────────┬──────────┘   │
 └──────────────┼───────────────────────────────┼──────────────┘
                │                               │
                ▼                               ▼
       Vite Asset Pipeline         Dynamic Import & Execution
      (React Fast Refresh)           of `api/*.ts` Handlers
```

1. **Zero-Configuration Backend**: Requests matching `/api/*` are intercepted by Vite middleware in `vite.config.ts` and routed directly to the TypeScript serverless handlers in `api/`.
2. **Environment Variable Injection**: Vite loads `.env.local` and `.env` files into `process.env` before executing API handlers.
3. **Database Fallback**: When `DATABASE_URL` is omitted in `.env.local`, API handlers gracefully fall back to in-memory mocks or local snapshot storage, enabling offline development.

---

## 4. Environment Variables Matrix

### Client-Side Variables (`apps/web/`)

| Variable | Required | Default Value | Description |
| :--- | :---: | :--- | :--- |
| `VITE_DATABASE_URL` | Optional | `""` | Local development fallback for the Neon Postgres connection string. |
| `VITE_GOOGLE_PLACES_API_KEY`| Optional | `""` | Google Places API key for Date Spots search and interactive maps. |
| `VITE_OMDB_API_URL` | Optional | `"/api/omdb"` | Base URL for OMDb film metadata proxy. |
| `VITE_TVMAZE_API_URL` | Optional | `"/api/tvmaze"`| Base URL for TVMaze television metadata proxy. |

### Server-Side Variables (`api/`)

| Variable | Required | Default Value | Description |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | Recommended | `""` | Neon pooled Postgres connection string for shared state persistence. |
| `SESSION_SIGNING_SECRET` | Recommended | In-memory ephemeral | Secret used to sign HMAC session cookies and PIN tokens. |
| `AGENT_API_TOKEN` | Optional | `""` | Shared bearer token for private Agent API reads and actions. |
| `OMDB_API_KEY` | Recommended | `""` | OMDb API key utilized by the serverless `/api/omdb` caching proxy. |
| `ALLOWED_ORIGINS` | Optional | `"*"` | CORS origin allowlist for API handlers. |

---

## 5. Development Workflows & Best Practices

### 5.1. Adding a New State Scope
1. Define the TypeScript data contract in `apps/web/src/shared/types.ts`.
2. Add normalization and mutation validation logic in `api/_lib/state.ts`.
3. If special game physics or serverless logic is needed, add pure helper functions in `api/_lib/gameHelpers.ts` (adhering to ADR-001).
4. Create or update the corresponding consumer hook under `apps/web/src/hooks/`.

### 5.2. Testing Guidelines
- All unit and integration tests are co-located alongside their respective source files using the `*.test.ts` or `*.test.tsx` naming convention.
- Write tests for:
  - Complex state transformations and mutation handlers.
  - Mathematical projection helpers (e.g. `CurvedInput.tsx` arc math, `DriftWall.tsx` modulo bounds).
  - API session and PIN verification routines.
- Run `pnpm test` locally to verify changes.

### 5.3. Pre-Commit / Pre-Deploy Checklist
Before pushing code or creating a pull request:
```bash
# 1. Ensure type integrity
pnpm check-types

# 2. Run static analysis
pnpm lint

# 3. Execute test suite
pnpm test

# 4. Confirm clean bundle generation
pnpm build
```
Or execute the all-in-one validation command:
```bash
pnpm verify
```
