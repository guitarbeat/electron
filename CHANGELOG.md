# Changelog

All notable changes to the **Collaborative Movie Night ("Electron")** application are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- **Formal Technical Audit Suite (`docs/audits/`)**:
  - `DRIFTWALL_AUDIT.md`: Mathematical proofs, Euclidean double-modulo loop analysis, and GPU compositor benchmarks for `DriftWall.tsx`.
  - `CSS_AUDIT.md`: Comprehensive audit of CSS bundle footprint, specificity cascades, and identification of 182 orphaned BEM selectors for Tailwind migration.
  - `LINTING_AUDIT.md`: Pipeline audit covering ESLint 9 Flat Config, TypeScript rules, and diagnostic heatmaps across legacy components.
  - `README.md`: Central index and methodology specification for engineering audits.
- **CurvedInput UI Primitive (`apps/web/src/components/ui/CurvedInput.tsx`)**:
  - Interactive SVG-based circular arc input bar with mathematical text, caret, and button projection along continuous radius curves (`sagitta` geometry calculations).
  - Synchronized hidden native `<input>` ensuring complete accessibility and keyboard/IME support.

### Changed
- **Documentation Overhaul**:
  - Standardized cross-referencing, architectural diagrams, and runbooks across all markdown documentation files.
  - Integrated ADR-001 decisions directly into architecture and site layout specifications.
- **Verification Pipeline Stabilization**:
  - Configured `@typescript-eslint/no-unused-vars` and `react-refresh/only-export-components` in `eslint.config.js` to ensure deterministic CI runs without blocking active feature iteration.

---

## [0.2.0] - 2026-08-05

### Added
- **DriftWall 3D Kinetic Canvas (`apps/web/src/components/ui/DriftWall.tsx`)**:
  - Infinite-looping 3D movie poster wall with perspective tilt (`perspective: 1200px`), exponential damping physics, and golden-ratio phase variance.
  - Asymptotic delta-time clamping ($\Delta t \le 50\text{ms}$) protecting against frame jumps upon waking from background tabs.
- **Smart TV & 10-Foot Remote Navigation (ADR-001)**:
  - Spatial D-Pad navigation with high-contrast focus rings (`outline: 3px solid hsl(var(--primary))`).
  - Remote Back-key event listeners (`Escape`, `GoBack`, `10009`, `461`) for frictionless modal dismissal.
  - Fallback solid card rendering on low-power TV hardware lacking GPU backdrop blur acceleration.
- **Serverless Dependency Isolation (ADR-001)**:
  - Extracted pure game state logic into `api/_lib/gameHelpers.ts` to prevent Node ESM module resolution errors during state polling.
- **Agent API v1 (`api/agent/`)**:
  - Public catalog and suggestion endpoints (`/api/agent/v1/catalog`, `/api/agent/v1/suggestions`).
  - Private data inspection and 2-phase confirmation workflow with single-use cryptographic tokens.
  - Machine-readable OpenAPI contract (`/api/agent/v1/openapi.json`) and `/llms.txt` integration.

---

## [0.1.0] - 2026-04-10

### Changed
- **Modular Service Consolidation**: Grouped 17+ scattered services into logical domain modules (`state`, `metadata`, `content`, `polling`).
- **Repository Hygiene**: Migrated architectural plans and environment notes to the `docs/` directory.
- **Metadata Resilience**: Refactored `metadataService` to provide automatic OMDb-to-TVMaze fallback upon missing search hits.

---

## [0.0.1] - 2026-03-27

### Added
- **Interactive Action Bubbles**: Floating gesture-aware action bubble menu for profile switching and quick tools.
- **Y2K Retro Visual Shell**: Nostalgic chrome header, dialog-box search, and filmstrip border styling.
- **Shared State Sync**: Polling-based synchronization with Neon Postgres persistence.
- **Mini-Games**: Spin wheel picker, Matchmaker swipe deck, and retro Compatibility Quiz.
