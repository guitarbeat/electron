# Project History & Regression Log

This document combines the narrative history of the project with a rigorous record of its regressions and fixes.

---

## 📅 Repo at a Glance (Oct 29, 2025 → Mar 12, 2026)

- **Total Commits**: 928
- **Contributors**: 18
- **Core Product**: A shared movie-night app for two people.
- **Visual Identity**: Papyrus, spin wheel, iMessage chat, floating bubbles, and a Y2K shell.

### Monthly Commit Activity
| Month | Commits | Executive Read |
| --- | ---: | --- |
| `2025-10` | 7 | Birth of the app, backend pivot to Gist, first playful UI move. |
| `2025-11` | 28 | Social layer arrives: message board, retro chat styling. |
| `2025-12` | 9 | Reliability work around spin persistence and cross-device usability. |
| `2026-01` | 79 | Metadata, design tokens, denser watchlist UI. |
| `2026-02` | 516 | Expansion: profiles, PINs, iOS chat, bubbles, games. |
| `2026-03` | 289 | Y2K refactor, file-count reduction, server proxy hardening. |

---

## 🚶 A Stroll Through Memory Lane (Eras 1-5)

### Era 1 — Oct 29, 2025: Prototype to Product Skeleton
The repo findings its shape in a single day.
- **Initial Commit (`e0df6cf`)**: App is born as a concept statement.
- **Backend Pivot (`a6446d2`)**: Migrated to GitHub Gist for storage, an architecture decision that stuck.
- **First Flare (`7244c9d`)**: Added the spin wheel for movie selection, marking the start of its playful identity.

### Era 2 — Nov to Dec 2025: The App Gets a Voice
The project adds its social layer and "retro chat" flavor.
- **Message Board (`96dfea5`)**: Collaboration becomes human through both planning and talking.
- **Voice Check (`392f54c`)**: Changed "who dis b?" avatar login, establishing its personal tone.
- **UI Vibes (`c833c43`)**: Retro iMessage style redesign for the message board.

### Era 3 — Jan 2026: Richer Movie Intelligence
Metadata and denser layouts make the app feel like a mature product with opinions.
- **Full Metadata (`91b5e1d`)**: Watchlist becomes information-rich with OMDb fetching and masonry grids.

### Era 4 — Feb 2026: Identity & Playful Expansion
The "explosion" month. User boundaries, chat polish, and "little world" energy.
- **iOS Chat UI (`e6db31f`)**: Messaging takes on its final iPhone chat-bubble aesthetic.
- **Access Control (`c565123`)**: Profiles and PIN verification introduce necessary boundaries.
- **Bubble Identity (`e564c51`)**: Added the "random cat image" to guest avatars.

### Era 5 — Mar 2026: Y2K Shell, Consolidation, & Hardening
Maximalist visuals meet disciplined engineering.
- **Y2K UI (`a2225c2`)**: The app doubles down on nostalgia with gel bubbles and dashboard chrome.
- **Server Proxy (`28a92ef`)**: Gist access is moved behind API handlers (Vite dev middleware + deployable `/api` routes) for security and reliability.
- **Modernization (`3ce46e4`)**: Upgraded to ESLint 9, Vite 6, and modern package health.
- **Spin wheel + Gist**: Recent picks and the UTC “daily” wheel outcome persist via `/api/state/spinHistory` and `/api/state/dailySpin`.

### Era 6 — Apr 2026: Service Consolidation & Repo Hygiene
Architectural cleanup and module-based reorganization.
- **Service Consolidation**: Grouped 17+ scattered services into logical modules (`state`, `metadata`, `content`, `polling`) to reduce architectural complexity.
- **Root Cleanup**: Moved planning documents (`CONSOLIDATION_PLAN.md`, `IMPORT_FIXES_CHECKLIST.md`), architectural notes (`ARCHITECTURE.md`), and environment guides (`DEVELOPMENT.md`, `AGENTS.md`) into the `docs/` folder for better repo hygiene.
- **Import Refinement**: Updated all feature components and hooks to use the new module structure.

---

## 🐛 The Regression Log

This is a chronological inventory of regressions captured from the `git log` and commit subjects.

### March 2024 Audit Pass (Recent Remediation)
- [x] **Guarded Spin-Wheel Flow**: Modal cannot be dismissed mid-spin (`20f8e9b`).
- [x] **Restored Submission Anchors**: Prevents browser from hard-submitting watchlist forms (`6856914`).
- [x] **Cohesive Shell Actions**: Quiz and matchmaker are back behind intentional launch actions (`ecee9ad`).
- [x] **Quiz Reset Logic**: Retakes start as fresh sessions with synced answers (`baa1636`).
- [x] **State Isolation**: keyboard input from minigames no longer leaks into main page state (`f9a6694`).
- [x] **Pinned Modal Fix**: Security/PIN modals always release global state on close (`a599e85`).
- [x] **Esc Handling**: Scoped modal Escape handling to the focused layer only (`ecee9ad`).
- [x] **Mobile Scroll Lock**: mobile sheet preserves pre-existing overflow state on close (`cf6160c`).

---

## 🛤️ Path Crosswalk

| Historical Path | Closest Current Path in Repo | Role in Modern Ecosystem |
| --- | --- | --- |
| `components/UserSelection` | `src/components/common/UserSelection.tsx` | Entry point for login/profile handoff. |
| `components/Watchlist.tsx` | `src/components/movies/Watchlist.tsx` | The product's core functional anchor. |
| `components/SpinWheel.tsx` | `src/components/spinWheel/SpinWheelGame.tsx` | Spin / selection mechanics. |
| `components/MessageBoard` | `src/components/messages/MessageBoard.tsx` | Message board surface. |
| `MovieItem.tsx` | `src/components/movies/MovieCard.tsx` | Movie rows evolved into rich cards in the watchlist module. |
| `gistConfig.ts` | `src/services/gistClient.ts` | Backend interaction moved to guarded client. |
| `Dashboard.tsx` | `src/app/App.tsx` and `src/app/App.scss` | Original dashboard UI absorbed into the root shell. |

---

## 🧠 Patterns Behind Regressions

1. **Spin-Wheel Fragility**: Visibility and loading state issues recur throughout the project.
2. **Shell Churn**: High risk when login and Y2K shell flows are reshaped simultaneously.
3. **State & Fallback Risk**: PIN state and auth credentials required several hardening passes.
4. **Migration Risk**: Moves into `src/` and rebases produced "restore" cycles for watchlist logic.

---

## 🗺️ Source Notes
- Built from `git log HEAD --reverse --date=short --pretty=format:'%h %ad %s'`.
- Milestone files tracked via `git show --name-only`.
- Regression inventory based on explicit "fix", "restore", "guard", or "fallback" commit subjects.
