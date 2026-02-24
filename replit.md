# replit.md

## Overview

A collaborative movie watchlist app built for two users (Aaron and Electra). It lets them manage a shared movie queue, mark movies as watched, exchange messages, take personality quizzes, spin a wheel to pick random movies, share memories about watched films, and receive movie suggestions from visitors. All persistent data is stored in a GitHub Gist (acting as a lightweight JSON database), and movie metadata is fetched from the OMDb API.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend-Only SPA

This is a **client-side only** React application bundled with Vite. There is no backend server — all data persistence happens through the GitHub Gist API directly from the browser.

- **Framework**: React 19 with TypeScript
- **Bundler**: Vite 7 (dev server runs on port 5000, host 0.0.0.0)
- **Styling**: Inline styles with a centralized design token system (`design-system/tokens.ts`) — no CSS framework or CSS-in-JS library
- **State Management**: React Context (`UserContext`) for current user, custom hooks for all domain logic
- **Package Manager**: pnpm

### Project Structure

```
├── App.tsx                    # Root app component with tab navigation
├── index.tsx                  # React entry point
├── types.ts                   # Shared TypeScript types (Movie, Message, User, etc.)
├── gistConfig.ts              # GitHub Gist configuration (env vars)
├── config/
│   ├── security.ts            # Input sanitization and validation constants
│   └── imageConfig.ts         # User avatar image URLs
├── context/
│   └── UserContext.tsx         # Current user state (persisted in sessionStorage)
├── design-system/
│   └── tokens.ts              # Spacing, colors, typography, motion, shadows, radius, z-index
├── hooks/                     # Custom React hooks for all domain logic
│   ├── useMovies.ts           # Movie CRUD with polling and metadata enrichment
│   ├── useMessages.ts         # Message board with sanitization
│   ├── useMemories.ts         # Shared memory wall
│   ├── useSuggestions.ts      # Movie suggestions from visitors
│   ├── useQuiz.ts             # Personality quiz data
│   ├── usePins.ts             # PIN-based profile protection
│   ├── usePolling.ts          # Generic polling hook with deduplication
│   ├── useSpinWheel.ts        # Spin wheel physics (drag, flick, friction)
│   ├── useMediaQuery.ts       # Responsive breakpoint detection
│   ├── useChatLogic.ts        # Chat message sending/deleting orchestration
│   ├── useUndoRedo.ts         # Generic undo/redo state management
│   └── useUserColors.ts       # Per-user color theming
├── services/                  # Data access layer (all talk to GitHub Gist API)
│   ├── movieService.ts        # Movie list CRUD via Gist
│   ├── messageService.ts      # Message board via Gist
│   ├── memoryService.ts       # Shared memories via Gist
│   ├── suggestionService.ts   # Movie suggestions via Gist
│   ├── quizService.ts         # Quiz data via Gist
│   ├── pinService.ts          # PIN hashing and verification via Gist
│   ├── dailySpinService.ts    # Daily spin result persistence via Gist
│   ├── metadataService.ts     # OMDb API + TVMaze for movie/show metadata
│   ├── PollingManager.ts      # Singleton that deduplicates polling across hooks
│   └── geminiService.ts       # Gemini API integration (placeholder)
├── components/                # UI components
│   ├── ui/                    # Reusable primitives (Card, Button, Input, IconButton, BottomSheet, etc.)
│   ├── quiz/                  # Quiz flow and editor
│   ├── memories/              # Memory wall components and utilities
│   ├── message-board/         # Chat window, message list, message input
│   ├── main/                  # ExtrasHub, ProfileSheet
│   ├── extras/                # Spin wheel
│   ├── snake/                 # Snake mini-game
│   ├── effects/               # Confetti animation
│   └── icons.tsx              # SVG icon components
└── verification/              # Test scripts (Playwright E2E, benchmarks, security tests)
```

### Data Layer Pattern

All data flows through this pattern:

1. **Service** (`services/*.ts`) — Raw fetch calls to GitHub Gist API for CRUD
2. **PollingManager** (`services/PollingManager.ts`) — Singleton that deduplicates polling; multiple hooks subscribing to the same key share one fetch interval
3. **usePolling hook** — Generic hook that subscribes to PollingManager, provides data/error/loading/refresh
4. **Domain hook** (`useMovies`, `useMessages`, etc.) — Wraps usePolling with domain-specific mutation logic and sanitization
5. **Component** — Consumes domain hook, renders UI

### Data Storage: GitHub Gist as Database

All persistent state is stored as JSON files within a single GitHub Gist:

- `movielist.json` — Movie queue
- `messages.json` — Message board
- `quiz.json` — Quiz questions and character data
- `suggestions.json` — Movie suggestions from visitors
- `memories.json` — Shared memory wall entries
- `dailyspin.json` — Daily spin wheel result
- `pins.json` — Hashed user PINs

Mutations use optimistic-style read-modify-write: fetch latest → apply change → PATCH back. There's no server-side conflict resolution; last write wins.

### Authentication

Lightweight, trust-based system for two known users:

- User selects their profile (Aaron or Electra) on a selection screen
- Optional 4-digit PIN protection per profile (hashed with a simple hash function, stored in Gist)
- Session persisted in `sessionStorage`
- No OAuth, no JWT, no server auth

### Input Sanitization

All user input is sanitized via `config/security.ts` (`sanitizeInput`) which strips control characters and trims whitespace. Applied in both hooks and services. Max length constants defined for messages, authors, and movie titles.

### Responsive Design

Uses `useMediaQuery` hook with breakpoint constants. Components use inline styles that adapt based on `isMobile` boolean. No CSS media queries in stylesheets — all responsive logic is in JS.

### Testing

- Unit tests use Node.js built-in test runner (`node:test` + `node:assert`)
- E2E tests use Playwright (Python scripts in `verification/`)
- Tests mock `global.fetch` to avoid real API calls
- Linting: ESLint with Airbnb + TypeScript config
- Formatting: Prettier

### Key Design Decisions

1. **No backend server** — Chose GitHub Gist API as a zero-cost, zero-maintenance JSON store for a small private app between two users. Trade-off: no conflict resolution, no real-time sync, rate limits.

2. **Polling instead of WebSockets** — Data freshness via configurable polling intervals (5s–30s depending on data type) through a centralized PollingManager that prevents duplicate fetches. Simpler than WebSockets given the Gist backend.

3. **Inline styles with design tokens** — Avoided CSS-in-JS libraries or CSS modules. All styling uses React `style` props with values from `design-system/tokens.ts`. Keeps the dependency footprint minimal.

4. **Environment variables via Vite** — All secrets (Gist token, OMDb key, etc.) accessed via `import.meta.env` with `VITE_` prefix. A safe accessor pattern `(import.meta.env || {})` is used in some files for Node.js test compatibility.

## External Dependencies

### GitHub Gist API

- **Purpose**: Primary data store for all app data
- **Auth**: Personal access token with `gist` scope, set via `VITE_GIST_TOKEN` env var
- **Config**: `VITE_GIST_ID` identifies the specific Gist
- **Rate limits**: GitHub API rate limits apply (5000 req/hr authenticated)

### OMDb API

- **Purpose**: Movie metadata (poster, year, plot, rating, runtime, genre, director)
- **Config**: `VITE_OMDB_API_KEY` for direct access, or `VITE_OMDB_PROXY_URL` for proxied access (Supabase Edge Function)
- **Fallback**: TVMaze API (`api.tvmaze.com`) used as secondary source for TV show metadata

### Gemini API

- **Purpose**: AI features (placeholder — `geminiService.ts` is empty)
- **Config**: `GEMINI_API_KEY` in `.env.local`

### NPM Dependencies

- **Runtime**: React 19, ReactDOM 19 (no other runtime dependencies)
- **Dev**: Vite, TypeScript, ESLint (Airbnb config), Prettier, Playwright
