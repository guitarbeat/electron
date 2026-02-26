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
├── config/
│   ├── gistConfig.ts          # GitHub Gist configuration (env vars)
│   ├── security.ts            # Input sanitization and validation constants
│   └── imageConfig.ts         # User avatar image URLs
├── context/
│   └── UserContext.tsx         # Current user state (persisted in sessionStorage)
├── design-system/
│   └── tokens.ts              # Spacing, colors, typography, motion, shadows, radius, z-index
├── hooks/                     # Custom React hooks for all domain logic
├── services/                  # Data access layer (all talk to GitHub Gist API)
├── components/                # UI components
│   ├── common/                # Shared components (MovieItem, MessageBoard, icons, etc.)
│   ├── ui/                    # Reusable primitives (Card, Button, Input, etc.)
│   ├── quiz/                  # Quiz flow and editor
│   ├── memories/              # Memory wall components
│   ├── message-board/         # Chat window, message list
│   ├── main/                  # ExtrasHub, ProfileSheet
│   ├── extras/                # Spin wheel
│   ├── snake/                 # Snake mini-game
│   └── effects/               # Confetti animation
└── docs/                      # Documentation (AI_RULES, CONTRIBUTING, replit)
```

### Data Layer Pattern

All data flows through this pattern:

1. **Service** (`services/*.ts`) — Raw fetch calls to GitHub Gist API for CRUD
2. **PollingManager** (`services/PollingManager.ts`) — Singleton that deduplicates polling
3. **usePolling hook** — Generic hook that subscribes to PollingManager
4. **Domain hook** (`useMovies`, `useMessages`, etc.) — Wraps usePolling with domain-specific mutation logic
5. **Component** — Consumes domain hook, renders UI

### Data Storage: GitHub Gist as Database

All persistent state is stored as JSON files within a single GitHub Gist. Config in `config/gistConfig.ts`.

### Authentication

Lightweight, trust-based system for two known users. Optional 4-digit PIN per profile (hashed, stored in Gist).

### Input Sanitization

All user input is sanitized via `config/security.ts` (`sanitizeInput`).

### Testing

- Unit tests: Node.js built-in test runner
- E2E: Playwright (Python scripts in `verification/`)
- Linting: ESLint (Airbnb) + Prettier

## External Dependencies

### GitHub Gist API

- **Config**: `VITE_GIST_ID`, `VITE_GIST_TOKEN` in `.env` (see `config/gistConfig.ts`)

### OMDb API

- **Config**: `VITE_OMDB_API_KEY` or `VITE_OMDB_PROXY_URL`

### NPM Dependencies

- **Runtime**: React 19, ReactDOM 19
- **Dev**: Vite, TypeScript, ESLint, Prettier, Playwright
