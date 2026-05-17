# Workspace Structure Audit Report

This report presents a comprehensive, recursive audit of all directories and files within the workspace. The goal is to identify semantic overlaps, suggest a highly intuitive folder structure to minimize cognitive load, and map out the required directory merges.

## 1. Directory Merge Analysis

### API & State Management
* **Merge Candidate:** `api/` and `src/api/` -> Combine into `src/infrastructure/api`
  * **Rationale:** Having two separate folders for API logic (`api/` and `src/api/`) creates confusion about whether a file represents frontend integration, backend route definitions, or shared types. Merging them into a single domain encapsulates all external communication in one place.
* **Merge Candidate:** `src/services/state`, `src/api/stateRoutes.ts`, `api/_lib/state.ts` -> Combine into `src/infrastructure/state`
  * **Rationale:** State management is a core infrastructure concern. Grouping schemas, clients, and mock data under one logical domain makes it easier to track the data layer.

### Feature Domains
* **Merge Candidate:** Spread out `components/movies`, `hooks/movies`, `services/content/movieRecords.ts` -> Combine into `src/features/movies`
  * **Rationale:** A feature-driven approach collocated components, hooks, and services related to a specific domain ("movies"). This prevents jumping across `components/`, `hooks/`, and `services/` to understand a single feature.
* **Merge Candidate:** Spread out `components/places`, `hooks/places` -> Combine into `src/features/places`
  * **Rationale:** Collocate everything related to places.
* **Merge Candidate:** Spread out `components/quiz`, `hooks/useQuiz.ts` -> Combine into `src/features/quiz`
  * **Rationale:** Keep the entire quiz sub-application self-contained.
* **Merge Candidate:** Spread out `components/messages`, `services/content/messageService.ts`, `hooks/useMessages.ts` -> Combine into `src/features/messages`
  * **Rationale:** Group the messaging capability.
* **Merge Candidate:** Spread out `components/memories`, `services/content/memoryService.ts` -> Combine into `src/features/memories`
  * **Rationale:** Group the memory capability.

### Minigames
* **Merge Candidate:** `components/spin-match`, `components/spin-wheel`, `components/matchmaker` -> Combine into `src/features/minigames`
  * **Rationale:** These represent distinct, interactive "game" modes that don't need top-level feature folders. Grouping them establishes a clear category.

### Core & Application Shell
* **Merge Candidate:** `src/app/` -> Rename to `src/core`
  * **Rationale:** `core` better describes foundational providers, error boundaries, and main shell layouts than `app`, which is often overloaded.
* **Merge Candidate:** `src/components/common` and `src/components/ui` -> Combine into `src/design-system`
  * **Rationale:** A single home for all reusable UI primitives, icons, and base components clearly separates them from feature-specific components.
* **Merge Candidate:** `src/theme`, `src/branding`, `src/components/effects` -> Combine into `src/design-system/visuals` (or keep `theme/` and `branding/` inside `design-system`)
  * **Rationale:** Visual identity, tokens, and visual effects all contribute to the design system.

### Utilities & Services
* **Merge Candidate:** `src/utils/`, `src/shared/`, `src/services/metadata/` -> Combine into `src/infrastructure/utils` and `src/infrastructure/metadata`
  * **Rationale:** Group cross-cutting concerns together.

## 2. Naming Suggestions

To ensure the workspace feels intentional and hyper-descriptive, the following naming conventions are proposed:

* `components/ui` -> `design-system/components` (Clearer distinction of reusable UI primitives).
* `components/effects` -> `design-system/effects` (Groups visual enhancements).
* `hooks/useMovies.ts` -> `features/movies/useMovies.ts` (Collocated).
* `services/metadata/` -> `infrastructure/metadata/` (Clearly indicates external or lower-level data fetching).
* `api/_lib/` -> `infrastructure/api/core/` (Removes the confusing `_` prefix and explains its purpose).
* `src/app/WorkspaceErrorBoundary.tsx` -> `src/core/errors/WorkspaceErrorBoundary.tsx` (More structured).

## 3. Proposed Visual Layout (Optimized Structure)

```text
/
├── src/
│   ├── core/                     # Foundational application setup and shell
│   │   ├── providers/
│   │   ├── errors/
│   │   ├── layouts/              # Was AppWorkspaceShell, etc.
│   │   └── main.tsx
│   │
│   ├── design-system/            # Reusable UI, themes, and branding
│   │   ├── components/           # Was components/ui and components/common
│   │   ├── effects/              # Was components/effects
│   │   ├── branding/             # Was src/branding
│   │   └── theme/                # Was src/theme
│   │
│   ├── features/                 # Vertical slices of functionality
│   │   ├── movies/               # Includes components, hooks, and local utils
│   │   ├── places/
│   │   ├── messages/
│   │   ├── memories/
│   │   ├── quiz/
│   │   ├── minigames/            # Grouped spin-wheel, spin-match, matchmaker
│   │   └── suggestions/          # Was hooks/suggestions
│   │
│   ├── infrastructure/           # Low-level systems, APIs, and cross-cutting concerns
│   │   ├── api/                  # Combined top-level api/ and src/api/
│   │   ├── state/                # State management, mock data
│   │   ├── polling/              # Was services/polling
│   │   ├── metadata/             # External metadata fetching (OMDB, TVMaze)
│   │   └── utils/                # Shared utilities and types
```

## Summary
The current structure splits related concepts (e.g., Movies, API, State) horizontally across `hooks/`, `components/`, and `services/`, and even across root folders (`api/` vs `src/api/`). The proposed feature-driven, vertically sliced architecture significantly reduces cognitive load. Developers will instinctively know that anything related to "movies" is in `src/features/movies`, rather than hunting across three different directories.
