# File Consolidation Summary

Date: March 12, 2026

## Overview
This document started as a consolidation log from March 12, 2026. The repo has since evolved and some file
paths/scripts referenced below no longer match the current `main` branch layout.

## Current repo state (as of March 18, 2026)
- Utilities are consolidated primarily in `src/utils.ts` (not `src/utils/index.ts`).
- Context providers are consolidated in `src/context.tsx` (not `src/context/index.tsx`).
- UI styles referenced during consolidation are now primarily centralized in `App.css` (not `src/components/ui/ui.css`).
- This repo’s `package.json` currently includes scripts: `dev`, `build`, `preview`, and `check-types`.

## Round 1: Utilities & CSS

### 1. Utility Files Consolidated
Merged three separate utility modules into a single utilities surface. In the current repo, that surface is `src/utils.ts`:
- `src/config/security.ts` (deleted)
- `src/utils/validation.ts` (deleted)
- `src/utils/concurrency.ts` (deleted)

The new consolidated file includes:
- Security constants and functions (sanitizeInput, isValidUrl)
- Validation framework (createValidator, validatePlace, validateAndThrow)
- Concurrency utilities (concurrentMap, shuffleArray)

### 2. CSS Files Consolidated
Merged component-specific CSS into the shared app stylesheet (currently `App.css`):
- `src/components/common/GelBubbleAvatar.css` (deleted)
- `src/components/common/UserSelection.css` (deleted)
- `src/components/matchmaker/Matchmaker.css` (deleted)

All animations and styles preserved, now in a single location.

### 3. Action Surface Consolidation

Action entries were consolidated into a shared floating-bubble visual system in `App.css`:
- Sidebar `Actions` stack
- Mobile quick command ribbon
- More-sheet actions

Behavior still comes from the existing `commandDeck` map in `App.tsx`, with only styling/layout updates.

### Scope Notes
- Changes are CSS-only in `App.tsx` data model/logic.
- No API, data model, routing, or modal flow behavior was changed.
- Touch points were limited to `App.tsx` rendering and `App.css` presentation classes.

### Benefits of Action Surface Work
- Shared action styling now comes from a single `App.css` system while preserving existing command wiring.
- Sidebar, mobile, and bottom-sheet action surfaces now share a consistent floating bubble presentation.
- No behavior changes were made to command handlers or modal launch flows.

## Round 2: Context Providers

### 4. Context Files Consolidated
Merged three separate context providers into a single consolidated context module (currently `src/context.tsx`):
- `src/context/UserContext.tsx` (deleted)
- `src/context/ThemeContext.tsx` (deleted)
- `src/context/ToastContext.tsx` (deleted)

The new consolidated file includes:
- ThemeProvider and useTheme hook
- ToastProvider and useToast hook
- UserProvider and useUser hook

### 5. Import Updates
Updated all imports across the codebase:
- Components: Matchmaker, GelBubbleAvatar, UserSelection, SpinWheelGame, PlacesList, QuizEditor, ThemeToggle, FloatingMemoriesPanel, FoodMergeGame
- Hooks: useMovies, usePlaces, useSuggestions, useWatchlist
- Services: memoryService, metadataService
- App.tsx root component

## Results

### File Count Reduction
- Before Round 1: ~74 source files
- After Round 1: 69 source files
- After Round 2: 67 source files
- Total Reduction: 7 files (9.5%)

### Component Files
- Before: ~59 files
- After: 56 files
- Reduction: 3 files

### Context Files
- Before: 3 files
- After: 1 file
- Reduction: 2 files (66%)

### Benefits
1. Fewer files to navigate and maintain
2. Single source of truth for utilities and contexts
3. Consolidated CSS reduces duplication
4. Easier to find and update shared code
5. Cleaner import statements
6. Related functionality grouped together
7. Reduced cognitive overhead when working with contexts
8. Unified action surfaces improve consistency across desktop and mobile workflows
9. Action UI cleanup was completed without changing feature behavior

## Verification
✅ TypeScript compilation: `npm run check-types` (Passed)
✅ Production build: `npm run build` (Successful)

## Next Steps
Following the repo simplification plan, next phases could include:
- Phase 2: Consolidate watchlist/movie surface
- Phase 3: Simplify shared layer further
- Phase 4: Service/hook rationalization
- `src/services/mockData.ts`: movie mock data has been removed to avoid “test movies” appearing when the Gist is unreachable.
  - Remaining exports are limited to `MOCK_MEMORIES` and `MOCK_SUGGESTIONS`.
  - Consider removing or further isolating these remaining mocks if we want *zero* demo data in offline mode.

## Notes
- All functionality preserved
- No breaking changes
- Backward compatibility maintained through proper import updates
- Context providers maintain same API surface
- All hooks remain independently accessible

## Unused Code Audit (Consolidated)

Status: historical note (the specific branch reference may not exist in this repo anymore).

This section merges the previously standalone unused-code audit findings and outcomes after cleanup.

### Removed

- Dead floating/minigame shell code:
  - `src/components/common/DraggableFeatureBubble.tsx`
  - `src/components/common/MinecraftBubble.tsx`
  - `src/components/effects/ChromaticDotField.tsx`
  - `src/components/snake/SnakeGame.tsx`
  - `src/components/snake/SnakeGame.css`
  - `src/components/snake/snakeGameLogic.ts`
  - `src/hooks/useFloatingBubbleDrag.ts`
  - `src/components/ui/floatingBubbleStyles.ts`
  - `src/context/BubbleDismissContext.tsx`
  - `src/components/ui/TabBar.tsx`
  - `tests/snakeGameLogic.test.ts`

- Parked Supabase scaffolding:
  - `src/integrations/supabase/types.ts`
  - `supabase/config.toml`
  - `supabase/functions/gemini-proxy/index.ts`
  - `supabase/functions/gemini-proxy/deno.json`
  - `supabase/functions/omdb-proxy/deno.json`

- Unused package entries:
  - `@supabase/supabase-js`
  - `matter-js`
  - `pnpm`
  - `@types/matter-js`
  - `eslint-config-airbnb-typescript`
  - `playwright`

- Stale env/config surface:
  - removed unused Supabase and Minecraft env examples from `.env.example`
  - removed unused gist filename constants from `src/config/gistConfig.ts`

### Integrated

- Tightened shared app types in `src/types.ts`
  - removed dead `MainTab` variants
  - removed dormant `Message`, `DailySpin`, `SpinEntry`, and `SpinHistory` models
  - trimmed quiz re-exports to those consumed through `@/types`

- Tightened live file API surfaces:
  - removed unused theme context API/re-exports in `src/context/ThemeContext.tsx`
  - converted internal-only exports to local symbols in:
    - `src/components/matchmaker/SwipeCard.tsx`
    - `src/components/memories/memoryUtils.ts`
    - `src/components/quiz/QuestionTemplates.ts`
    - `src/components/ui/MinigameModal.tsx`
    - `src/components/ui/Skeleton.tsx`
    - `src/components/ui/SubNav.tsx`
    - `src/components/ui/Toast.tsx`
    - `src/components/ui/modalPrimitives.ts`
    - `src/context/ToastContext.tsx`
    - `src/hooks/useMovies.ts`
    - `src/hooks/usePins.ts`
    - `src/services/gistClient.ts`
    - `src/services/memoryService.ts`
    - `src/services/metadataService.ts`
    - `src/utils/validation.ts`
    - `src/design-system/tokens.ts`
    - `src/components/common/icons/index.tsx`
    - `src/components/quiz/types.ts`

- Simplified the app shell in `App.tsx`
  - removed the now-empty `BubbleDismissProvider` wrapper
  - updated action surfaces to a bubble-centric presentation style by restyling command cards and mobile actions in `App.css` without changing command behavior

### Verification

- `npm run check-types`: passes
- `npm run build`: passes

If another audit is needed later, start from the current branch state rather than earlier findings.
