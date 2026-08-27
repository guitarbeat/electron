# Collaborative Movie Night App

## Overview

A two-person collaborative movie watchlist and date-planning SPA titled "electron." Built for exactly two named users (Aaron and Electra), the app lets them manage a shared movie watchlist, send messages, play matchmaker-style swipe games, spin a wheel to pick a movie, take compatibility quizzes, and browse date spot ideas.

**Core features:**
- Shared movie watchlist with OMDb/TVMaze metadata enrichment
- iMessage-style message board
- Spin wheel for movie selection
- Matchmaker swipe game
- Compatibility quiz (styled as a retro 1990s internet advertisement — Comic Sans, blinking marquee banners, rainbow borders, Windows 98-style progress bar)
- Date spots/places workspace (Google Places integration)
- Y2K / Windows 98 UI throughout: Win98 chrome navbar, silver dialog-box search bar, Win98 outset borders on movie cards, Win98 listbox autocomplete, retro button styling
- Draggable floating action bubble for navigation (profile switching lives exclusively in this menu — no duplicate session bar)

**Profile/session UX:** Profile selection (Aaron / Electra / Guest) lives only in the action bubble quick-actions menu. A legacy `app-session-bar` header panel that created a duplicate login UI was removed; the `ActionBubble.tsx` and `ActionFanMenu.tsx` UI components are also gone (replaced by `ActionBubbleLayer.tsx`).

**Persistence model:** defaults to `localStorage`; upgrades to Neon Postgres when `DATABASE_URL` is configured.

**Deploy shape:** static frontend (`dist/`) + serverless-style API handlers in `api/` (Vercel target).

---

## User Preferences

Preferred communication style: Simple, everyday language.

---

## System Architecture

### Frontend

- **Framework:** React 19 with TypeScript, bundled by Vite 7
- **Entry point:** `index.html` → `apps/web/src/main.tsx` → `apps/web/src/app/App.tsx`
- **Styling:** CSS (Tailwind CSS in `apps/web/src/app/globals.css`), design tokens in `apps/web/src/theme/`
- **Graphics:** `ogl` (WebGL), `chroma-js` for color math
- **Fonts:** Inter, Outfit, Space Grotesk via Google Fonts

**Directory layout:**
```
apps/web/src/
  app/         # Shell, providers, action bubble, workspace switching
  components/  # Feature UI (watchlist, messages, matchmaker, spinWheel, places, quiz, effects, ui, ...)
  hooks/       # Shared React hooks (useMovies, useMessages, useMatchmaker, usePolling, ...)
  services/    # Domain modules: state, metadata, content (messages, memories), polling
  shared/      # Shared TypeScript types
  theme/       # Design tokens
  utils/       # Shared helpers (date.ts, browser.ts, shared.ts, random.ts, styling.ts, commonUtils.ts)
```

**State management:** No Redux/Zustand. Uses React context (`ThemeProvider`, `UserProvider`, `ToastProvider` all consolidated in `src/app/providers.tsx`) plus custom hooks that wrap a polling service. Polling hits `/api/state/:scope` endpoints on a configurable interval (15–30s).

**Routing:** No router library. Two primary workspaces (`queue` / `places`) toggled via a `MainTab` state value in `App.tsx`. URL params handle shared suggestion intents and logo lab feature flags.

**API proxy in dev:** `vite.config.ts` registers a custom Vite middleware that intercepts `/api/*` requests and dynamically imports + executes the corresponding `api/*.ts` handler. No separate backend process runs locally.

### Backend / API Handlers

Serverless-style handlers in `api/`, designed for Vercel Functions. Each handler exports a default `withWebHandler(handler)` which adapts between Node.js IncomingMessage style and the Web `Request`/`Response` API.

**Key handlers:**
| File | Purpose |
|---|---|
| `api/omdb.ts` | OMDb proxy with in-memory cache (1h TTL, 500 entries), rate limiting (30 req/min/IP), retries |
| `api/tvmaze.ts` | TVMaze proxy with in-memory cache |
| `api/health.ts` | Liveness + optional readiness probe against shared database state |
| `api/session.ts` | Returns current session state and PIN-protected user list |
| `api/session/profile.ts` | POST to set profile, PIN verification with lockout |
| `api/state/[scope].ts` | GET scoped shared state (movies, messages, places, quiz, matchmaker, etc.) |
| `api/state/[scope]/mutate.ts` | POST mutations to scoped state |

**Shared library (`api/_lib/`):**
- `config.ts` — Shared `resolveConfig` helper for environment variable resolution
- `sharedStateStore.ts` — Neon Postgres read/write with 30s per-file TTL cache
- `state.ts` — Business logic: normalization, mutation handlers per scope
- `session.ts` — HMAC-signed cookie sessions, PIN hashing (PBKDF2), lockout
- `http.ts` — Response helpers (`jsonResponse`, `mergeHeaders`, etc.)
- `retryFetch.ts` — Exponential backoff with jitter for HTTP API calls
- `webHandler.ts` — Adapts Node.js request/response to Web API `Request`/`Response`

**Shared UI components:**
- `src/components/ui/MediaCard.tsx` — Compound component providing shared card structure (PosterWrap, Cover, Overlay, Title, Badge, Actions, Info, Subtext) used by both MovieCard and PlaceCard

### Persistence

**Primary (always available):** `localStorage` — used as fallback and for some client-only state (quiz completion flag, action bubble position, etc.).

**Optional shared sync:** Neon Postgres via `api/_lib/sharedStateStore.ts`. When `DATABASE_URL` is configured, each scope is stored as a JSON string row in `shared_state_files`. The client syncs via polling to `/api/state/:scope`.

**Scope model:** State is split into named scopes, each mapping to a logical filename used as the row key (e.g., `movielist.json`, `messages.json`, `places.json`, `quiz.json`, `matchmaker.json`, `pins.json`). Mutations are validated server-side before writing.

### Authentication

- No traditional auth. Two hardcoded named users: `Aaron` and `Electra`.
- Optional PIN protection per user, stored in shared state (`pins.json`).
- Sessions held in HMAC-signed HTTP cookies (`SESSION_SIGNING_SECRET`).
- PIN attempts tracked in a separate short-lived cookie; locked out after 5 failures for 5 minutes.
- Guests can view but write operations check session state.

### Testing

- Node.js built-in test runner (`node --test`).
- Test files co-located as `*.test.ts` in `src/`.
- Tests cover: API handlers, shared state store, state schemas, session logic, UI logic (action bubble math, shell state, shared suggestion parsing, logo lab).

### Build & Deploy

- `pnpm build` → Vite outputs static files to `dist/`
- `vercel.json` rewrites: `/api/state/:scope/mutate` and `/api/state/:scope` to dynamic handler files; all other paths fall through to `index.html` (SPA routing)
- `pnpm verify` = `check-types && lint && test && build` — run before every deploy

---

## External Dependencies

### APIs & Services

| Service | Integration point | Purpose |
|---|---|---|
| **Neon Postgres** | `api/_lib/sharedStateStore.ts` | Shared persistence store (optional) |
| **OMDb API** | `api/omdb.ts` + `@/services/metadata` | Movie metadata (title, poster, ratings, plot) |
| **TVMaze API** | `api/tvmaze.ts` | TV show metadata |
| **Google Places API** | Map/places components, `VITE_GOOGLE_PLACES_API_KEY` | Date spot search and maps |
| **Google Fonts** | `index.html` preconnect links | Typography (Inter, Outfit, Space Grotesk) |

### Key npm Packages

| Package | Role |
|---|---|
| `react` / `react-dom` 19 | UI framework |
| `vite` 7 + `@vitejs/plugin-react` | Dev server, HMR, production bundler |
| `typescript` ~5.9 | Type safety |
| `ogl` | WebGL for visual effects |
| `chroma-js` | Color manipulation |
| `sass` / `sass-embedded` | SCSS compilation |
| `@tailwindcss/vite` / `tailwindcss` | CSS styling |
| `eslint` + `typescript-eslint` | Linting |

### Environment Variables

**Client-side (`VITE_*`):**
- `VITE_DATABASE_URL` — local dev fallback for Neon/Postgres
- `VITE_API_SECRET` — must match server `API_SECRET` for authorized writes
- `VITE_OMDB_API_URL` / `VITE_OMDB_API_KEY` — OMDb override
- `VITE_GOOGLE_PLACES_API_KEY` — maps/places features

**Server-side (Vercel/serverless):**
- `DATABASE_URL` — Neon/Postgres storage
- `API_SECRET` — authorizes client mutations
- `SESSION_SIGNING_SECRET` — signs session cookies (required for PIN auth)
- `OMDB_API_KEY` / `OMDB_API_URL` — OMDb proxy