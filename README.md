# Collaborative Movie Night ("Electron")

> A two-person collaborative movie watchlist, date-planning space, and kinetic entertainment canvas built with **React 19**, **TypeScript**, and **Vite**, featuring a Y2K-inspired retro-future visual shell, 3D kinetic gallery walls, and serverless shared state synchronization.

---

## 🎬 Overview

**Electron** is a dedicated shared space built for two named users (Aaron & Electra) to plan movie nights, save date spots, send messages, play mini-games, and discover films.

### Key Capabilities
- 🎞️ **DriftWall 3D Kinetic Gallery**: GPU-accelerated infinite-looping 3D movie poster wall powered by Euclidean modular arithmetic and golden-ratio phase variance.
- 📐 **CurvedInput Search Bar**: Mathematical circular arc search input mapping typography, carets, and buttons along a customizable curve geometry.
- 🍿 **Shared Watchlist & Metadata**: Rich metadata enrichment via OMDb and TVMaze proxies with responsive grid and list layouts.
- 📍 **Date Spots / Places**: Dedicated date planning workspace with Google Places integration and visited state tracking.
- 🎲 **Interactive Mini-Games**:
  - **Spin & Match**: Roulette-style movie picker with physics damping.
  - **Matchmaker**: Swipe-based movie matching deck.
  - **Compatibility Quiz**: Retro 1990s-styled interactive relationship quiz.
- 💬 **iMessage-Style Chat**: Private messaging board with avatar styling and timestamped feeds.
- 🤖 **Agent API (v1)**: Vendor-neutral REST & OpenAPI endpoints for tool-calling AI agents to inspect catalogs, submit suggestions, and execute 2-phase confirmed actions.
- 📺 **Smart TV & 10-Foot Navigation**: Spatial D-Pad navigation, high-contrast focus rings, and TV remote Back-key dismissal support.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: >= 20.x (Node 22 LTS recommended)
- **Package Manager**: `pnpm` (preferred) or `npm`

### Installation & Local Run

```bash
# Install dependencies
pnpm install

# Start local development server (http://localhost:5000)
pnpm dev
```

During local development, Vite dev middleware automatically mounts serverless handlers in `api/` to intercept `/api/*` requests. No separate backend process is required.

---

## 🛠️ Validation & Tooling Commands

| Command | Purpose |
| :--- | :--- |
| `pnpm dev` | Starts Vite dev server with API middleware at `http://localhost:5000` |
| `pnpm verify` | Runs full pre-deploy suite (`check-types` + `lint` + `test` + `build`) |
| `pnpm build` | Compiles optimized static assets to `dist/` |
| `pnpm preview` | Serves production build locally for verification |
| `pnpm lint` | Runs ESLint flat config validation across all packages |
| `pnpm check-types` | Executes TypeScript compiler across `api/`, `libs/`, and `apps/web/` |
| `pnpm test` | Runs automated test suite (`tsx --test "src/**/*.test.ts"`) |

---

## 🏛️ System Architecture

```
 ┌─────────────────────────────────────────────────────────────┐
 │                     Client (React 19 SPA)                   │
 │   ┌─────────────────┐ ┌─────────────────┐ ┌─────────────┐   │
 │   │ DriftWall (3D)  │ │ CurvedInput SVG │ │ Workspaces  │   │
 │   └─────────────────┘ └─────────────────┘ └─────────────┘   │
 └──────────────────────────────┬──────────────────────────────┘
                                │ HTTP / JSON Polling (15-30s)
 ┌──────────────────────────────▼──────────────────────────────┐
 │             Vercel Serverless Handlers (`api/`)             │
 │   ├── /api/session               (HMAC Cookie Auth)         │
 │   ├── /api/state/:scope          (Scoped State Sync)        │
 │   ├── /api/omdb & /api/tvmaze    (Cached Metadata Proxies)  │
 │   └── /api/agent/v1/*            (OpenAPI & LLM Actions)    │
 └──────────────────────────────┬──────────────────────────────┘
                                │ SQL over Pooler
 ┌──────────────────────────────▼──────────────────────────────┐
 │                Neon Serverless Postgres                     │
 │          Table: `shared_state_files` (JSON Bins)            │
 └─────────────────────────────────────────────────────────────┘
```

---

## 📂 Repository Layout

```
.
├── api/                         # Serverless API handlers & shared backend libraries
│   ├── _lib/                    # DB connectors, state normalization, sessions, agent engine
│   ├── agent/                   # Agent API v1 endpoints (catalog, suggestions, actions)
│   ├── session.ts               # User profile authentication & PIN verification
│   └── state/                   # Scoped shared state read & mutation endpoints
├── apps/web/                    # Frontend React 19 single-page application
│   ├── src/
│   │   ├── app/                 # Root shell, layout wrappers, and global CSS
│   │   ├── components/          # Feature UI (DriftWall, CurvedInput, Watchlist, Places, etc.)
│   │   ├── hooks/               # React hooks (useMovies, useMessages, usePolling, etc.)
│   │   ├── services/            # State clients, metadata fetchers, and content managers
│   │   └── theme/               # HSL color tokens and visual theme definitions
│   └── tsconfig.json            # Web app TypeScript configuration
├── docs/                        # Complete project documentation & architectural records
│   ├── architecture/            # System architecture, design tokens & site layout
│   ├── operations/              # Local development & production deployment runbooks
│   ├── api/                     # Agent API v1 specification & OpenAPI contracts
│   ├── decisions/               # Architecture Decision Records (ADRs)
│   ├── audits/                  # Formal technical audits (DriftWall, CSS, Linting)
│   └── history/                 # Chronological history, regressions & technical snapshot
└── package.json                 # Monorepo scripts, tooling, and dependencies
```

---

## 🔐 Environment Variables

| Variable | Target | Purpose |
| :--- | :--- | :--- |
| `DATABASE_URL` | Server | Neon Postgres pooled connection string for shared state |
| `SESSION_SIGNING_SECRET` | Server | Secret for signing HMAC session cookies & PIN tokens |
| `AGENT_API_TOKEN` | Server | Shared bearer credential for private Agent API access |
| `OMDB_API_KEY` | Server | API key for server-side OMDb metadata caching proxy |
| `VITE_GOOGLE_PLACES_API_KEY` | Client | Google Places API key for Date Spots maps & search |
| `VITE_DATABASE_URL` | Client/Dev | Optional local dev fallback for direct database access |

---

## 📚 Documentation Catalog

Comprehensive guides and architectural audits are organized by domain in the [`docs/`](docs/README.md) hub:

### 🏛️ Architecture & Design
- **[System Architecture](docs/architecture/ARCHITECTURE.md)**: Deep dive into state sync, database schemas, and service boundaries.
- **[Design System](docs/architecture/DESIGN.md)**: Design tokens, typography, HSL palettes, and 3D kinetic specs.
- **[Site Layout Guide](docs/architecture/SITE_LAYOUT.md)**: App shell, workspace hierarchy, and modal stacks.

### 💻 Operations & Guides
- **[Development Guide](docs/operations/DEVELOPMENT.md)**: Local workflows, tooling, and coding conventions.
- **[Deployment Runbook](docs/operations/DEPLOYMENT.md)**: Production hosting on Vercel, caching, and health checks.

### 🤖 API & Decisions
- **[Agent API Guide](docs/api/AGENT_API.md)**: LLM tool discovery, OpenAPI schema, and 2-phase confirmations.
- **[Architecture Decision Records](docs/decisions/README.md)**: Index of ADRs including [ADR-001 (Serverless Isolation & TV UX)](docs/decisions/ADR-001-serverless-isolation-neon-and-tv-ux.md).

### 📊 Technical Audits & History
- **[Technical Audits Hub](docs/audits/README.md)**:
  - 🏎️ [DriftWall Kinetic Audit](docs/audits/DRIFTWALL_AUDIT.md) (3D physics, modular loops, GPU offload)
  - 🎨 [CSS Architecture Audit](docs/audits/CSS_AUDIT.md) (Bundle bloat, specificity, Tailwind migration)
  - 🔍 [Static Analysis Audit](docs/audits/LINTING_AUDIT.md) (ESLint 9 Flat Config, TypeScript rules)
- **[Project History](docs/history/HISTORY.md)**: Timeline of milestones, regression logs, and path crosswalks.
- **[Technical Snapshot](docs/history/YOUWARE.md)**: Monorepo tech stack reference and key modules.
