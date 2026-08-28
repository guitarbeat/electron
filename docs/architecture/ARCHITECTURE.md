# Comprehensive System Architecture Specification

## 1. System Overview

**Electron** is a collaborative single-page application (SPA) and kinetic date-planning space built for two named users (**Aaron** and **Electra**). The platform combines shared real-time movie watchlist management, metadata enrichment, private messaging, interactive decision mini-games (Spin Wheel, Matchmaker, Quiz), and date spot exploration under a cohesive Y2K-inspired retro-future visual shell.

```
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                                   Client Application                                   │
 │                                                                                        │
 │   ┌────────────────────────────────────────────────────────────────────────────────┐   │
 │   │                             Shell Control Strip                                │   │
 │   │  [Profile: Aaron/Electra]  [Theme: Movies/Places]  [Background: Moiré/Water]    │   │
 │   └────────────────────────────────────────────────────────────────────────────────┘   │
 │                                                                                        │
 │   ┌───────────────────────────────┐        ┌───────────────────────────────────────┐   │
 │   │   Watchlist Workspace         │        │    Date Spots Workspace               │   │
 │   │  ├── DriftWall 3D Wall        │   OR   │   ├── Google Places Search & Maps     │   │
 │   │  ├── CurvedInput Search       │        │   ├── Place Cards & Coords Preview    │   │
 │   │  └── Suggestions & Memories   │        │   └── Visited vs Queue Tracking       │   │
 │   └───────────────────────────────┘        └───────────────────────────────────────┘   │
 │                                                                                        │
 │   ┌────────────────────────────────────────────────────────────────────────────────┐   │
 │   │                             Feature Modal Stack                                │   │
 │   │     [Spin Wheel Picker]    [Matchmaker Deck]    [Compatibility Quiz]           │   │
 │   └────────────────────────────────────────────────────────────────────────────────┘   │
 └───────────────────────────────────────────┬────────────────────────────────────────────┘
                                             │ HTTP JSON Polling (15–30s)
 ┌───────────────────────────────────────────▼────────────────────────────────────────────┐
 │                     Vercel Serverless Handlers (`api/`)                                │
 │                                                                                        │
 │   ├── api/session.ts & api/session/profile.ts   (HMAC Signed Cookie Auth + PINs)       │
 │   ├── api/state/[scope].ts                      (Scoped JSON State Reads)              │
 │   ├── api/state/[scope]/mutate.ts               (Server-Validated State Mutations)     │
 │   ├── api/omdb.ts & api/tvmaze.ts               (In-Memory Cached Metadata Proxies)    │
 │   ├── api/health.ts                             (Liveness & Deep DB Readiness Probes)  │
 │   └── api/agent/v1/*                            (Machine OpenAPI Contract & LLM Tools) │
 └───────────────────────────────────────────┬────────────────────────────────────────────┘
                                             │ SQL over Connection Pooler
 ┌───────────────────────────────────────────▼────────────────────────────────────────────┐
 │                        Neon Serverless Postgres (`DATABASE_URL`)                       │
 │                                                                                        │
 │   ├── Table: `shared_state_files`   (Primary JSON storage by scope filename)           │
 │   └── Table: `agent_audit_logs`     (Machine agent operation ledger)                   │
 └────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Architecture (`apps/web/`)

### 2.1. Core Technology Stack
- **Framework**: React 19 with strict TypeScript typing.
- **Bundler & Dev Server**: Vite 7 with custom local API proxy middleware.
- **Styling Architecture**:
  - Tailwind CSS utilities for structural layout and responsive flex/grid wrappers.
  - HSL CSS custom property tokens (`apps/web/src/theme/theme.css`) for runtime theme switching (`Movies` vs `Places`).
  - Isolated 3D GPU layer stylesheet (`apps/web/src/components/ui/DriftWall.css`).
- **3D Graphics & Canvas Engine**: `ogl` for WebGL moiré and optical wave background simulations.
- **Color Manipulation**: `chroma-js` for procedural palette generation and contrast testing.

### 2.2. Directory Structure
```
apps/web/src/
├── app/                 # Root application shell, providers, and layout stacks
│   ├── App.tsx          # Master workspace switcher and feature modal orchestrator
│   ├── providers.tsx    # Unified context tree (Theme, User/Session, Toast)
│   ├── globals.css      # Base resets, typography clamp rules, focus indicators
│   └── component-styles.css # Specialized BEM components
├── components/          # Domain-specific UI features
│   ├── ui/              # Design system primitives (DriftWall, CurvedInput, MediaCard, Dialog)
│   ├── movies/          # Watchlist, suggestions, movie cards, and memories
│   ├── places/          # Date spots grid, Google Places autocomplete, map cards
│   ├── spinWheel/       # Physics-damped roulette spin wheel picker
│   ├── matchmaker/      # Card-swipe film matchmaker game
│   ├── quiz/            # 1990s retro internet advertisement compatibility quiz
│   └── messages/        # iMessage-style real-time message board
├── hooks/               # Custom React hooks (useMovies, useMessages, useModalBehavior, usePolling)
├── services/            # Client services (stateClient, metadataService, pollingService)
├── shared/              # Shared data contracts and TypeScript type definitions
└── theme/               # HSL color palettes and CSS custom property declarations
```

### 2.3. State Management & Synchronization
The application eschews heavy client state libraries (such as Redux or Zustand) in favor of lightweight, deterministic React context paired with a scoped polling client (`services/stateClient.ts` + `services/pollingService.ts`):
1. **Scoped State Buckets**: Application data is partitioned into isolated scopes (`movielist`, `messages`, `places`, `quiz`, `matchmaker`, `spinHistory`, `pins`).
2. **Polling Interval**: Background sync runs every 15–30 seconds.
3. **Optimistic UI Updates**: Local mutations update component state immediately and queue an asynchronous mutation request to `/api/state/:scope/mutate`.
4. **Local Snapshot & Outbox Fallback**: When `DATABASE_URL` is omitted or network drops occur, the state client seamlessly reads from and writes to `localStorage`, preventing application crashes.

---

## 3. Specialized Kinetic UI Primitives

### 3.1. DriftWall 3D Kinetic Canvas (`components/ui/DriftWall.tsx`)
- **Visual Function**: Infinite-looping 3D movie poster wall with perspective tilt (`perspective: 1200px`) and optical vignette masking.
- **Mathematical Foundations**:
  - **Euclidean Modular Wrapping**: Offsets wrap using `((next % H) + H) % H` across $[0, H)$, eliminating visual seams during bidirectional drift.
  - **Golden Ratio Phase Hashing**: Column velocities are modulated by $\phi \approx 0.6180339887$, preventing harmonic resonance or synchronized mechanical movement.
  - **Exponential Asymptotic Damping**: Pointer parallax uses $1 - e^{-\Delta t / \tau}$ ($\tau = 0.045\text{s}$) for framerate-independent response across 60Hz, 120Hz, and 240Hz displays.
  - **Delta Time Clamping**: $\Delta t \le 50\text{ms}$ protects against frame teleportation upon waking from background tabs.

### 3.2. CurvedInput SVG Geometry (`components/ui/CurvedInput.tsx`)
- **Visual Function**: Curved search bar projecting typography, carets, placeholder text, and interactive buttons along a circular arc.
- **Mathematical Foundations**:
  - Computes chord width $w$, sagitta $s$, and curvature radius $R = \frac{s}{2} + \frac{w^2}{8s}$.
  - Generates SVG `<path>` definitions using native arc commands (`M x y A rx ry ...`).
  - Employs SVG `<textPath>` to align text labels dynamically while synchronizing state with a hidden native `<input>` element for complete accessibility and screen reader support.

---

## 4. Backend & Serverless API Architecture (`api/`)

### 4.1. Serverless Execution Model
All backend functionality is structured as standalone serverless handlers under `api/`, optimized for deployment to Vercel Functions and executed in local development via a custom Vite middleware.
- **Web API Handler Adapter (`api/_lib/webHandler.ts`)**: Wraps native Node.js `(req, res)` handlers to transparently support Web standard `Request` and `Response` objects.
- **Retry & Backoff (`api/_lib/retryFetch.ts`)**: Outbound requests to external services (OMDb, TVMaze) employ exponential backoff with random jitter.

### 4.2. Complete API Route Matrix

| Endpoint | Methods | Primary Purpose | Security / Headers |
| :--- | :---: | :--- | :--- |
| `/api/health` | `GET` | Uptime probe; supports shallow liveness and deep DB check (`?deep=1`) | Public |
| `/api/session` | `GET` | Returns active user profile, PIN protection flags, and session metadata | HMAC Signed Cookie |
| `/api/session/profile` | `POST` | Sets active profile; verifies PIN with lockout tracking | PBKDF2 Hash / Rate-Limited |
| `/api/state/[scope]` | `GET` | Retrieves raw JSON state payload for the requested scope | Public / Scoped |
| `/api/state/[scope]/mutate` | `POST` | Applies atomic mutations to the requested scope | Session Validated / Server Checked |
| `/api/omdb` | `GET` | Caching reverse-proxy for OMDb film metadata | Origin-Checked / In-Memory Cached |
| `/api/tvmaze` | `GET` | Reverse-proxy for TVMaze television show metadata | In-Memory Cached |
| `/api/agent/v1/openapi.json` | `GET` | Machine-readable OpenAPI 3.0 contract for AI agents | Public |
| `/api/agent/v1/catalog/*` | `GET` | Read-only catalog of movies and places | Public / Rate-Limited |
| `/api/agent/v1/suggestions/*` | `POST` | Unauthenticated public suggestions endpoint | IP Rate-Limited (10/hr) |
| `/api/agent/v1/private/*` | `GET` | Private household data reads (messages, history) | Bearer Token (`AGENT_API_TOKEN`) |
| `/api/agent/v1/actions` | `POST` | 2-phase confirmed action execution for LLM agents | Bearer Token + Confirmation Token |

---

## 5. Persistence & Database Architecture

### 5.1. Storage Model (Neon Postgres)
When `DATABASE_URL` is configured, persistence is handled by a pooled PostgreSQL instance hosted on Neon. Data is stored in the `shared_state_files` table:

```sql
CREATE TABLE IF NOT EXISTS shared_state_files (
    filename VARCHAR(255) PRIMARY KEY,
    content TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 5.2. Scope-to-Filename Mapping
| State Scope | Filename Key | Data Structure Overview |
| :--- | :--- | :--- |
| `movielist` | `movielist.json` | Array of movie records with OMDb metadata, watch state, ratings, and memories |
| `messages` | `messages.json` | Array of message objects with author (`Aaron`/`Electra`), timestamp, and content |
| `places` | `places.json` | Array of date spot ideas, Google Places IDs, and visited flags |
| `quiz` | `quiz.json` | Relationship compatibility questions, options, and historical score records |
| `matchmaker`| `matchmaker.json` | Active movie swipe decks and mutual match counters |
| `spinHistory`| `spin_history.json`| Circular buffer of recent spin wheel outcomes (capped at 20) |
| `pins` | `pins.json` | PBKDF2 salt and hash records for PIN-protected profiles |

---

## 6. Authentication, Profiles & Security

### 6.1. User Profiles & Sessions
- **Named Profiles**: The system recognizes two primary users (`Aaron` and `Electra`) plus a read-only `Guest` mode.
- **HMAC Signed Cookies**: Active session state is serialized, timestamped, and cryptographically signed using `SESSION_SIGNING_SECRET`.
- **PIN Verification**:
  - User PINs are hashed using PBKDF2 with unique salts.
  - Failed PIN attempts are recorded in an encrypted lockout cookie. Exceeding 5 failed attempts triggers an automatic 5-minute cooldown.

### 6.2. Smart TV & 10-Foot Navigation Architecture (ADR-001)
- **Spatial D-Pad Focus**: Interactive elements expose high-contrast `:focus-visible` styling (`outline: 3px solid hsl(var(--primary))`) ensuring readability from across a room.
- **Remote Back-Key Trapping**: The custom `useModalBehavior` hook captures hardware remote keys (`Escape`, `GoBack`, `10009`, `461`) to dismiss overlays.
- **Silk Browser Performance Fallback**: Low-power TV hardware lacking GPU backdrop-filter support degrades gracefully to high-opacity solid surfaces (`hsl(var(--card) / 0.96)`).
