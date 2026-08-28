# Collaborative Movie Watchlist ("Electron") — Technical Snapshot

A two-person collaborative movie watchlist, date-planning space, and kinetic entertainment canvas built with **React 19**, **TypeScript**, and **Vite**, featuring a Y2K-inspired retro-future visual shell, 3D kinetic gallery walls, and serverless shared state synchronization.

---

## ⚡ Technical Snapshot

- **Application Type**: Full-Stack Web Application (SPA + Serverless Edge Handlers)
- **Monorepo Structure**:
  - `apps/web/` — Frontend React 19 single-page application
  - `api/` — Serverless Node ESM handlers (Vercel Functions & Vite dev proxy)
  - `docs/` — Engineering specifications, design tokens, and technical audits
- **Package Manager**: `pnpm` (`pnpm-lock.yaml`)
- **Primary Runtime**: Node.js 22 LTS / Modern Evergreen Browsers
- **Build Engine**: Vite 7
- **UI & Styling**: Tailwind CSS utilities + SCSS design tokens + HSL CSS variables
- **3D Graphics & Shaders**: `ogl` (WebGL) + CSS 3D Transforms (`perspective: 1200px`)
- **Persistence**: Neon Serverless Postgres (`shared_state_files`) with local snapshot/outbox fallback
- **Metadata Sources**: OMDb API & TVMaze API (with in-memory server-side caching)
- **Maps & Geolocation**: Google Places API (when `VITE_GOOGLE_PLACES_API_KEY` is configured)

---

## 🚀 Quick Start & Common Commands

```bash
# Install all dependencies across workspace
pnpm install

# Launch local development server with API proxy (http://localhost:5000)
pnpm dev

# Execute complete validation suite (types, linting, tests, build)
pnpm verify

# Build production assets to dist/
pnpm build

# Run unit and integration tests
pnpm test

# Run ESLint validation
pnpm lint

# Run TypeScript typecheck
pnpm check-types
```

---

## 🏛️ Key Feature Modules

1. **DriftWall 3D Kinetic Canvas (`apps/web/src/components/ui/DriftWall.tsx`)**:
   - Multi-column 3D poster wall with continuous Euclidean modular wrapping.
   - Smooth gesture momentum, touch drags, and cursor tilt physics.
2. **CurvedInput UI Primitive (`apps/web/src/components/ui/CurvedInput.tsx`)**:
   - Mathematical SVG circular arc search bar mapping typography, carets, and buttons along customizable curves.
3. **Smart TV & 10-Foot Spatial Navigation (ADR-001)**:
   - D-Pad spatial focus rings, remote Back-key event interception, and solid card fallbacks for low-power TV hardware.
4. **Agent API v1 (`api/agent/`)**:
   - OpenAPI 3.0.3 machine-readable contract enabling AI tool-calling agents to read catalogs and execute 2-phase confirmed actions.
5. **Interactive Mini-Games**:
   - Physics-damped roulette Spin Wheel (`SpinWheelGame.tsx`).
   - Mutual film Matchmaker swipe deck (`MatchmakerGame.tsx`).
   - Retro 1990s-styled Compatibility Quiz (`QuizModal.tsx`).

---

## 🔐 Environment Configuration

Key environment variables (see `.env.example` for the full reference):
- `DATABASE_URL` — Neon Postgres connection string for shared state persistence.
- `SESSION_SIGNING_SECRET` — Secret used to cryptographically sign HMAC session cookies.
- `AGENT_API_TOKEN` — Bearer credential for private Agent API operations.
- `OMDB_API_KEY` — API key for server-side OMDb metadata caching proxy.
- `VITE_GOOGLE_PLACES_API_KEY` — Google Places API key for Date Spots maps.

---

## 📚 Documentation Index

For detailed deep-dives, consult the comprehensive guides in [`docs/`](README.md):
- [Architecture Guide](ARCHITECTURE.md)
- [Design Tokens & Kinetic Specs](DESIGN.md)
- [Development Guide](DEVELOPMENT.md)
- [Deployment Runbook](DEPLOYMENT.md)
- [Agent API Guide](AGENT_API.md)
- [Site Layout Guide](SITE_LAYOUT.md)
- [Technical Audits](audits/README.md)
- [History & Regression Log](HISTORY.md)
