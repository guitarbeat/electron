# ADR-001: Serverless Dependency Isolation, Neon Connection String Parsing, and Smart TV Spatial UX

## Status
Accepted

## Date
2026-08-05

## Context
The movie & state tracking web application is deployed on Vercel as serverless Node ESM handlers backed by Neon Postgres (`DATABASE_URL`). Recent operational and UX requirements surfaced three core challenges:
1. **Vercel Serverless Function Module Resolution**: Vercel bundles `api/` as Node ES modules (`"type": "module"` in `api/package.json`). When serverless handlers in `api/_lib/state.ts` imported game state logic from frontend UI component files under `src/components/`, Node ESM failed to resolve named exports at runtime, throwing 500 errors during state polling (`SyntaxError: The requested module ... does not provide an export named 'SPIN_HISTORY_MAX'`).
2. **Neon Connection String Parsing**: Vercel environment variables for Neon Postgres include connection parameters (`?channel_binding=require&sslmode=require`). Primitive regex string manipulation corrupted the query delimiter, causing database queries to fail with database connection errors.
3. **Smart TV & 10-Foot Remote Navigation**: Users browsing on Smart TVs (Fire TV Silk browser, Samsung Tizen, LG webOS) use D-Pad remotes without mouse cursor input. Standard web layouts lacked high-contrast spatial focus indicators, 10-foot TV target scaling, and TV remote Back/Return key support for modal dismissal.

## Decisions

### 1. Serverless Dependency Isolation (`api/_lib/gameHelpers.ts`)
- Decoupled serverless state logic from `src/components/` by extracting pure game state handlers (`appendSpinHistory`, `SPIN_HISTORY_MAX`, `applyMatchmakerSwipe`, `undoMatchmakerSwipe`) into a dedicated serverless helper module: `api/_lib/gameHelpers.ts`.
- Serverless handlers in `api/_lib/` now strictly import from pure serverless/shared modules, guaranteeing zero cross-boundary dependencies on frontend React/UI components.

### 2. URL Object Database Query Cleaner (`api/_lib/dbCommon.ts`)
- Consolidated database connection initialization and SSL parsing into `api/_lib/dbCommon.ts`.
- Standardized `cleanDatabaseUrl` using the native `URL` API (`u.searchParams.delete('channel_binding')`) to safely sanitize connection strings without breaking query string delimiters or host properties.

### 3. Smart TV Spatial Navigation & Silk Performance Rules
- **D-Pad Spatial Focus**: Configured high-contrast `:focus-visible` outline glow (`outline: 3px solid hsl(var(--primary))`, `box-shadow: 0 0 16px -2px hsl(var(--primary) / 0.7)`) for all interactive elements.
- **TV Remote Back Key Listener**: Expanded `useModalBehavior` to capture Smart TV remote Back/Return keys (`Escape`, `GoBack`, `10009`, `461`, and `Backspace` outside text inputs).
- **Silk Performance Fallback**: Added `@supports not (backdrop-filter: blur(1px))` to supply high-opacity solid card backgrounds (`hsl(var(--card) / 0.96)`) on low-cost TV hardware lacking GPU backdrop blur acceleration.

## Consequences
- State polling APIs on Vercel run with zero module resolution or syntax errors.
- Neon Postgres connections establish cleanly in both local dev server proxies and Vercel serverless environments.
- Smart TV and Fire TV browser users can navigate using remote D-Pad controls and dismiss modals via the TV Back button.
- All unit, integration, and build tests pass cleanly (`pnpm run verify`).
