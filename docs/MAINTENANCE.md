# Repository Maintenance & Simplification

This document tracks the ongoing effort to reduce codebase fragmentation, simplify shared patterns, and consolidate the repository for easier maintenance.

## 📈 Current Status (as of March 18, 2026)

- Utilities are consolidated in `src/utils.ts`.
- Context providers are consolidated in `src/context.tsx`.
- UI styles are primarily centralized in `App.css`.
- Action entries are unified in a floating-bubble visual system.
- TypeScript compilation and production builds pass consistently.

### File Count Reduction
- Starting Point: ~74 source files
- Final Target: 90-120 files in `src/` (Note: the project grew to 225 files at its peak before the simplification drive started).
- Current Reduction: ~7 files in recent rounds (9.5%).

---

## 🗺️ Repository Simplification Plan

The codebase is being refactored in phases to improve clarity and speed up feature development.

### Phase 1: Remove Obvious Redundancy (Completed/Ongoing)
**Goal**: Quick cleanup with minimal risk.
- Keep exactly one profile/login interaction pattern.
- Remove dead/unused components and stale CSS blocks.
- Remove duplicate style definitions for movie cards.
- Collapse tiny wrappers that only pass props.

### Phase 2: Consolidate Watchlist/Movie Surface
**Goal**: Make the primary user flow easy to reason about.
- Merge `movie` + `watchlist` overlap into one feature module.
- Keep one movie card implementation and one style source.
- Group view/state/actions per feature instead of scattering across folders.
- Move "one-off" helpers local to feature files when globally unused.

### Phase 3: Simplify Shared Layer
**Goal**: Make shared code truly shared.
- Split shared code into `shared/ui`, `shared/lib`, and `shared/types`.
- Move feature-specific code out of `common`.
- Merge tiny single-use hooks back into feature modules.

### Phase 4: Service/Hook Rationalization
**Goal**: Reduce cognitive overhead in data flow.
- Standardize polling/data-fetch lifecycle into one pattern.
- Merge near-duplicate service files by domain.
- Remove “micro-hooks” that only wrap one call.

---

## 🛠️ Consolidation History

### 1. Utilities Consolidated
Three separate utility modules were merged into `src/utils.ts`:
- `src/config/security.ts` (deleted)
- `src/utils/validation.ts` (deleted)
- `src/utils/concurrency.ts` (deleted)

The consolidated file now includes:
- Security constants and functions (sanitizeInput, isValidUrl)
- Validation framework (createValidator, validatePlace, validateAndThrow)
- Concurrency utilities (concurrentMap, shuffleArray)

### 2. CSS Consolidation
Merged component-specific CSS into the shared app stylesheet (`App.css`):
- `src/components/common/GelBubbleAvatar.css` (deleted)
- `src/components/common/UserSelection.css` (deleted)
- `src/components/matchmaker/Matchmaker.css` (deleted)

### 3. Context Provider Consolidation
Three separate context providers were merged into `src/context.tsx`:
- `src/context/UserContext.tsx`
- `src/context/ThemeContext.tsx`
- `src/context/ToastContext.tsx`

---

## 🧹 Unused Code Audit (Completed)

Status: historical note; the specific branch references may no longer exist in the repo.

### Removed Files/Modules
- **Dead Minigames/Shell Code**: `DraggableFeatureBubble`, `MinecraftBubble`, `ChromaticDotField`, `SnakeGame`, etc.
- **Supabase Scaffolding**: `supabase/config.toml`, serverless proxy functions, and package entries (`@supabase/supabase-js`).
- **Unused Dependencies**: `matter-js`, `pnpm` (from package key), `playwright`, `eslint-config-airbnb-typescript`.
- **Stale Config**: Removed Supabase and Minecraft env examples from `.env.example`.

### Refactoring Outcomes
- Tightened shared app types in `src/types.ts` (removed dead `MainTab` variants and dormant models).
- Converted internal-only exports to local symbols in multiple services and components (e.g., `movieService`, `memoryService`).
- Removed empty `BubbleDismissProvider` wrapper from `App.tsx`.

---

## 🤝 Working Agreement
1. **New files** only when reuse or complexity justifies it.
2. **Prefer adding 30-80 lines** to an existing feature file over creating a new micro-file.
3. **Feature code** stays inside the feature folder by default.
4. **Shared code** requires at least 2 feature consumers.
5. **Every PR** must include a "file count impact" note.
