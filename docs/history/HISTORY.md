# Project History & Architectural Evolution

This document chronicles the design history, evolutionary milestones, and regression remediation log for the **Collaborative Movie Night ("Electron")** application.

---

## 📅 Chronological Milestone Matrix (Oct 2025 → Aug 2026)

| Milestone / Era | Primary Focus | Key Architecture & UX Deliverables |
| :--- | :--- | :--- |
| **Era 1 (Oct 2025)** | Prototype & Core Skeleton | Birth of the concept; initial Gist-based storage; first Spin Wheel roulette. |
| **Era 2 (Nov–Dec 2025)** | Social Layer & Chat | iMessage-styled message board; initial avatar login system; retro styling. |
| **Era 3 (Jan 2026)** | Movie Intelligence | Rich metadata integration via OMDb and TVMaze; masonry card grids. |
| **Era 4 (Feb 2026)** | Identity & Security | Profile separation (Aaron vs Electra); PBKDF2 PIN verification; lockout cookies. |
| **Era 5 (Mar 2026)** | Y2K Shell & Serverless | Gel bubbles, dashboard chrome; migration to Vercel serverless handlers in `api/`. |
| **Era 6 (Apr–Jul 2026)** | Domain Consolidation | Grouped 17+ fragmented services into domain modules (`state`, `metadata`, `content`). |
| **Era 7 (Aug 2026)** | Kinetic 3D & Agent API | DriftWall 3D infinite canvas; CurvedInput SVG search; Smart TV navigation; Agent API v1. |

---

## 🚶 Detailed Evolution Through the Eras

### Era 1 — Oct 2025: Prototype to Skeleton
The application started as a lightweight collaborative idea for two people:
- **Concept Inception**: Initial interactive movie list.
- **Backend Selection**: Early prototypes leveraged GitHub Gist JSON storage before moving to structured serverless backends.
- **First Minigame**: Added a roulette-style spin wheel to resolve movie-night decision deadlocks.

### Era 2 — Nov to Dec 2025: Real-Time Social Layer
- **iMessage Messaging**: Added a private, real-time message board with distinct avatar bubbles for Aaron and Electra.
- **Voice & Identity**: Shifted tone from generic task managers to a playful, personal couples' space.

### Era 3 — Jan 2026: Film & TV Metadata Intelligence
- **OMDb & TVMaze Integration**: Movie cards enriched with plot summaries, IMDb ratings, runtimes, and high-resolution posters.
- **Smart Autocomplete**: Search inputs query OMDb first and fallback automatically to TVMaze when films have no hits.

### Era 4 — Feb 2026: Access Control & PIN Hardening
- **Profile Partitioning**: Distinct permissions for Aaron, Electra, and unauthenticated Guests.
- **Cryptographic Security**: PBKDF2 salt-and-hash PIN authentication with signed HTTP-only lockout cookies.

### Era 5 — Mar 2026: Y2K Retro Visual Language
- **Nostalgic Aesthetic**: Vintage Windows 98 outset borders, dialog boxes, and gel buttons.
- **Serverless API**: Replaced direct Gist fetches with secure Vercel Functions (`api/state/*`, `api/session`).

### Era 6 — Apr to Jul 2026: Service Consolidation
- **Domain Reorganization**: Reorganized scattered scripts into typed modules (`services/stateClient.ts`, `services/metadataService.ts`, `services/pollingService.ts`).
- **Monorepo Structure**: Separated web application code under `apps/web/` and serverless backend handlers under `api/`.

### Era 7 — Aug 2026: Kinetic 3D Surfaces, Smart TV & Agent API
- **DriftWall 3D Kinetic Canvas**: Developed a GPU-accelerated infinite 3D poster wall with perspective tilt (`perspective: 1200px`) and golden-ratio phase hashing.
- **CurvedInput UI Primitive**: Mathematical circular arc search bar using continuous SVG geometry.
- **Smart TV Spatial UX (ADR-001)**: D-Pad spatial focus rings, remote Back-key dismissal, and solid surface fallbacks on low-power TV hardware.
- **Agent API v1**: Machine-to-machine OpenAPI 3.0 endpoints enabling AI tool-calling agents to read catalogs and execute 2-phase confirmed actions.

---

## 🐛 Comprehensive Regression Log & Remediation

| Issue ID | Area | Root Cause & Failure Mode | Permanent Remediation |
| :--- | :--- | :--- | :--- |
| **REG-001** | Spin Wheel | Modal could be dismissed while the wheel was spinning, losing outcome state. | Implemented spin-state lock in `SpinWheelGame.tsx` preventing backdrop dismissals until physics halt. |
| **REG-002** | Search Forms | Pressing Enter in search fields occasionally triggered full-page browser navigation. | Added explicit `onSubmit={(e) => e.preventDefault()}` and button type isolation. |
| **REG-003** | Modal Keys | Pressing `Escape` dismissed all stacked modals simultaneously. | Scoped `useModalBehavior` to evaluate and dismiss only the topmost focused layer in the modal stack. |
| **REG-004** | Node ESM Imports | Serverless handlers crashed with `SyntaxError` when importing from UI component files. | Extracted pure state logic to `api/_lib/gameHelpers.ts` (ADR-001). |
| **REG-005** | Neon SSL Query | Regex string replacement corrupted `?sslmode=require` query parameters in Neon URLs. | Replaced custom regex parsing with native `URL` API manipulation in `api/_lib/dbCommon.ts`. |
| **REG-006** | TV Remote Back | Smart TV users could not dismiss overlays because `Escape` alone did not catch TV Back keys. | Added keycode bindings for `GoBack`, `10009`, `461`, and `Backspace` in `useModalBehavior.ts`. |

---

## 🛤️ Path Evolution Crosswalk

| Historical File Path | Current Path in Monorepo | Architectural Role |
| :--- | :--- | :--- |
| `components/Watchlist.tsx` | `apps/web/src/components/movies/Watchlist.tsx` | Core movie list, search, and queue panel. |
| `components/SpinWheel.tsx` | `apps/web/src/components/spinWheel/SpinWheelGame.tsx` | Physics-based movie selection wheel. |
| `components/MessageBoard.tsx`| `apps/web/src/components/messages/MessageBoard.tsx` | Private iMessage-style communication feed. |
| `components/MovieItem.tsx` | `apps/web/src/components/movies/MovieCard.tsx` | Outset border movie card component. |
| `services/gistClient.ts` | `apps/web/src/services/stateClient.ts` | Scoped state sync and mutation client. |
| `Dashboard.tsx` | `apps/web/src/app/App.tsx` | Main application shell and workspace switcher. |
| `components/DriftWall.tsx` | `apps/web/src/components/ui/DriftWall.tsx` | 3D kinetic infinite looping poster canvas. |
| `components/CurvedInput.tsx`| `apps/web/src/components/ui/CurvedInput.tsx` | SVG circular arc input geometry primitive. |
