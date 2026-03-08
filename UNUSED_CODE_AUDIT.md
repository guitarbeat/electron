# Unused Code Audit

This audit was produced from a repository-wide static sweep of the codebase on March 9, 2026.

Scope:
- Scanned all tracked `*.ts`, `*.tsx`, `*.js`, `*.jsx`, and `*.css` files outside `node_modules`, `dist`, `public`, and `attached_assets`
- Approximate scanned size: `23,748` lines
- Verification method: export inventory, repository-wide reference search, and spot checks on live entry points

This file separates:
- `Definitely unused`: no runtime references found in the repo
- `Unused export / stale API`: file is live, but part of its surface is unused
- `Transitively dead`: still referenced, but only from code already orphaned

## Definitely unused

### Orphaned components / modules

1. [src/components/common/DraggableFeatureBubble.tsx](/Users/aaron/Documents/github/electron/src/components/common/DraggableFeatureBubble.tsx#L14)
   - `DraggableFeatureBubble` is defined at line 14 and exported at line 51.
   - Repository-wide search found no imports or JSX usage outside this file.

2. [src/components/effects/ChromaticDotField.tsx](/Users/aaron/Documents/github/electron/src/components/effects/ChromaticDotField.tsx#L19)
   - `ChromaticDotField` is defined at line 19 and exported at line 333.
   - Repository-wide search found no imports or JSX usage outside this file.

3. [src/components/common/MinecraftBubble.tsx](/Users/aaron/Documents/github/electron/src/components/common/MinecraftBubble.tsx#L14)
   - `MinecraftBubble` is defined at line 14 and exported at line 186.
   - Repository-wide search found no imports or JSX usage outside this file.

4. [src/components/snake/SnakeGame.tsx](/Users/aaron/Documents/github/electron/src/components/snake/SnakeGame.tsx#L532)
   - `SnakeGame` is defined at line 532 and exported at line 863.
   - Repository-wide search found no imports or JSX usage outside this file.
   - Its stylesheet [src/components/snake/SnakeGame.css](/Users/aaron/Documents/github/electron/src/components/snake/SnakeGame.css) is only imported by this dead component.

5. [src/components/ui/TabBar.tsx](/Users/aaron/Documents/github/electron/src/components/ui/TabBar.tsx#L19)
   - `TabBar` is defined at line 19 and exported at line 100.
   - Repository-wide search found no imports outside this file.

### Unused icon exports

These exports exist in [src/components/common/icons/index.tsx](/Users/aaron/Documents/github/electron/src/components/common/icons/index.tsx), but repository-wide search found no imports or JSX usage outside their own definitions:

- [SearchIcon](/Users/aaron/Documents/github/electron/src/components/common/icons/index.tsx#L166)
- [ChevronLeftIcon](/Users/aaron/Documents/github/electron/src/components/common/icons/index.tsx#L202)
- [ChevronRightIcon](/Users/aaron/Documents/github/electron/src/components/common/icons/index.tsx#L215)
- [StarFilledIcon](/Users/aaron/Documents/github/electron/src/components/common/icons/index.tsx#L228)
- [ChevronDownIcon](/Users/aaron/Documents/github/electron/src/components/common/icons/index.tsx#L240)
- [ChevronUpIcon](/Users/aaron/Documents/github/electron/src/components/common/icons/index.tsx#L253)
- [CameraIcon](/Users/aaron/Documents/github/electron/src/components/common/icons/index.tsx#L266)
- [SendOutlineIcon](/Users/aaron/Documents/github/electron/src/components/common/icons/index.tsx#L290)
- [MessageIcon](/Users/aaron/Documents/github/electron/src/components/common/icons/index.tsx#L308)
- [SyncIcon](/Users/aaron/Documents/github/electron/src/components/common/icons/index.tsx#L326)

### Unused validators

These validators are defined in a live utility file but are not referenced anywhere else in the repo:

- [validateMovieTitle](/Users/aaron/Documents/github/electron/src/utils/validation.ts#L105)
- [validateMessage](/Users/aaron/Documents/github/electron/src/utils/validation.ts#L109)

## Transitively dead

These files are not top-level orphans, but their remaining references come entirely from code already identified as dead or from wrapper code that no longer has real consumers.

1. [src/hooks/useFloatingBubbleDrag.ts](/Users/aaron/Documents/github/electron/src/hooks/useFloatingBubbleDrag.ts#L43)
   - Imported only by:
     - [src/components/snake/SnakeGame.tsx](/Users/aaron/Documents/github/electron/src/components/snake/SnakeGame.tsx#L7)
     - [src/components/common/MinecraftBubble.tsx](/Users/aaron/Documents/github/electron/src/components/common/MinecraftBubble.tsx#L3)
     - [src/components/common/DraggableFeatureBubble.tsx](/Users/aaron/Documents/github/electron/src/components/common/DraggableFeatureBubble.tsx#L2)
   - All three consumers are currently unused.

2. [src/components/ui/floatingBubbleStyles.ts](/Users/aaron/Documents/github/electron/src/components/ui/floatingBubbleStyles.ts#L1)
   - Imported only by:
     - [src/hooks/useFloatingBubbleDrag.ts](/Users/aaron/Documents/github/electron/src/hooks/useFloatingBubbleDrag.ts#L6)
     - [src/components/common/DraggableFeatureBubble.tsx](/Users/aaron/Documents/github/electron/src/components/common/DraggableFeatureBubble.tsx#L4)
     - [src/components/common/MinecraftBubble.tsx](/Users/aaron/Documents/github/electron/src/components/common/MinecraftBubble.tsx#L5)
   - That keeps the file technically referenced, but only through dead floating-bubble code.

3. [src/components/snake/snakeGameLogic.ts](/Users/aaron/Documents/github/electron/src/components/snake/snakeGameLogic.ts#L105)
   - Still imported by the dead [SnakeGame.tsx](/Users/aaron/Documents/github/electron/src/components/snake/SnakeGame.tsx#L15) and by tests in [tests/snakeGameLogic.test.ts](/Users/aaron/Documents/github/electron/tests/snakeGameLogic.test.ts).
   - Runtime-wise, this logic is currently dead after the shell stopped rendering `SnakeGame`.

4. [src/context/BubbleDismissContext.tsx](/Users/aaron/Documents/github/electron/src/context/BubbleDismissContext.tsx#L46)
   - `useBubbleDismiss()` is only consumed by the dead [SnakeGame.tsx](/Users/aaron/Documents/github/electron/src/components/snake/SnakeGame.tsx#L9).
   - The provider is still mounted in [App.tsx](/Users/aaron/Documents/github/electron/App.tsx#L250), but there are no live consumers left in the rendered app.
   - This makes the provider wrapper in [App.tsx](/Users/aaron/Documents/github/electron/App.tsx#L250) effectively vestigial unless floating bubbles are coming back.

## Stale type / API surface

These items are not dead files, but they preserve states or APIs that no longer appear in the live UI.

1. [src/types.ts](/Users/aaron/Documents/github/electron/src/types.ts#L2)
   - `MainTab` still includes `'home'`, `'extras'`, and `'messages'`.
   - Repository-wide search only found those literals in the type definition itself.
   - The current app shell only mounts `'queue'` and `'places'` in [App.tsx](/Users/aaron/Documents/github/electron/App.tsx#L21).

2. [src/context/ThemeContext.tsx](/Users/aaron/Documents/github/electron/src/context/ThemeContext.tsx#L22)
   - `setTheme` is part of the public context value at lines 10 and 22-32.
   - Repository-wide search found no call sites outside this file.
   - `ThemeToggle` consumes `useTheme()` only for tokens, not for mutation.

3. [src/context/ThemeContext.tsx](/Users/aaron/Documents/github/electron/src/context/ThemeContext.tsx#L5)
   - `export { moviesTheme, placesTheme }` re-exports the token objects.
   - Repository-wide search found no imports from `ThemeContext` for those values.
   - The actual token usage imports from [src/design-system/tokens.ts](/Users/aaron/Documents/github/electron/src/design-system/tokens.ts) directly.

4. Exported prop/type surfaces that appear unused outside their defining file:
   - [MinigameModalProps](/Users/aaron/Documents/github/electron/src/components/ui/MinigameModal.tsx#L6)
   - [ToastProps](/Users/aaron/Documents/github/electron/src/components/ui/Toast.tsx#L6)
   - [SwipeCardHandle](/Users/aaron/Documents/github/electron/src/components/matchmaker/SwipeCard.tsx#L6)
   - [SubNavTab](/Users/aaron/Documents/github/electron/src/components/ui/SubNav.tsx#L4)
   - [SubNavChip](/Users/aaron/Documents/github/electron/src/components/ui/SubNav.tsx#L11)

## Notes on code that looks unused but is still live

These were checked and should not be removed based on this audit:

- [src/services/PollingManager.ts](/Users/aaron/Documents/github/electron/src/services/PollingManager.ts#L149) is live through [src/hooks/usePolling.ts](/Users/aaron/Documents/github/electron/src/hooks/usePolling.ts#L3).
- [src/services/metadataService.ts](/Users/aaron/Documents/github/electron/src/services/metadataService.ts#L181) is live through [src/hooks/useMovies.ts](/Users/aaron/Documents/github/electron/src/hooks/useMovies.ts#L11).
- [src/services/memoryService.ts](/Users/aaron/Documents/github/electron/src/services/memoryService.ts#L6) is live through watchlist and memories flows.
- [src/hooks/useUndoRedo.ts](/Users/aaron/Documents/github/electron/src/hooks/useUndoRedo.ts#L22) is live through [src/components/quiz/QuizEditor.tsx](/Users/aaron/Documents/github/electron/src/components/quiz/QuizEditor.tsx#L10).
- [src/hooks/usePlacesAutocomplete.ts](/Users/aaron/Documents/github/electron/src/hooks/usePlacesAutocomplete.ts#L36) is live through [src/components/places/PlacesList.tsx](/Users/aaron/Documents/github/electron/src/components/places/PlacesList.tsx#L4).
- [src/components/ui/ThemeToggle.tsx](/Users/aaron/Documents/github/electron/src/components/ui/ThemeToggle.tsx#L12) is live through [src/components/common/UserSelection.tsx](/Users/aaron/Documents/github/electron/src/components/common/UserSelection.tsx#L8).

## Recommended removal order

1. Delete the orphaned files first:
   - `src/components/common/DraggableFeatureBubble.tsx`
   - `src/components/effects/ChromaticDotField.tsx`
   - `src/components/common/MinecraftBubble.tsx`
   - `src/components/snake/SnakeGame.tsx`
   - `src/components/snake/SnakeGame.css`
   - `src/components/ui/TabBar.tsx`

2. Remove the transitive bubble stack:
   - `src/hooks/useFloatingBubbleDrag.ts`
   - `src/components/ui/floatingBubbleStyles.ts`
   - `src/context/BubbleDismissContext.tsx`
   - `BubbleDismissProvider` wrapper from [App.tsx](/Users/aaron/Documents/github/electron/App.tsx#L249)

3. Trim stale exports:
   - dead icons in `src/components/common/icons/index.tsx`
   - `validateMovieTitle`
   - `validateMessage`
   - unused exported prop/type aliases where internal-only types would suffice

4. Tighten shared types:
   - remove stale `MainTab` members `'home'`, `'extras'`, `'messages'`

## Caveat

This is a static audit, not a runtime trace. If some of this code is intentionally parked for future reintroduction, it is still unused in the current application state and should at least be marked or moved so it stops obscuring the live surface area.

## Second-Pass Findings

This section focuses on areas that are easy to miss in a first unused-export sweep: env drift, stale config constants, dormant type models, and parked scaffolding.

### Stale environment/config entries

1. [.env.example](/Users/aaron/Documents/github/electron/.env.example#L15)
   - `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are documented as required at lines 15-16.
   - Repository-wide search found no runtime references to either key in `src/`, `App.tsx`, tests, or Supabase function code.

2. [.env.example](/Users/aaron/Documents/github/electron/.env.example#L19)
   - `VITE_MINECRAFT_SERVER_ADDRESS` and `VITE_MINECRAFT_SERVER_PORT` are only consumed by the dead [src/components/common/MinecraftBubble.tsx](/Users/aaron/Documents/github/electron/src/components/common/MinecraftBubble.tsx#L16).
   - Once `MinecraftBubble` is removed, these env vars become stale docs.

3. [.env.example](/Users/aaron/Documents/github/electron/.env.example#L21)
   - `VITE_MINECRAFT_WEB_INTERFACE_PORT` is documented at line 21.
   - Repository-wide search found no references anywhere in the repo.

### Missed dead constants in live config

1. [src/config/gistConfig.ts](/Users/aaron/Documents/github/electron/src/config/gistConfig.ts#L26)
   - `GIST_MESSAGES_FILENAME` is declared at line 26 and re-exported at line 54.
   - Repository-wide search found no consumer outside `gistConfig.ts`.

2. [src/config/gistConfig.ts](/Users/aaron/Documents/github/electron/src/config/gistConfig.ts#L38)
   - `GIST_DAILY_SPIN_FILENAME` is declared at line 38 and re-exported at line 58.
   - Repository-wide search found no consumer outside `gistConfig.ts`.

3. [src/config/gistConfig.ts](/Users/aaron/Documents/github/electron/src/config/gistConfig.ts#L41)
   - `GIST_SPIN_HISTORY_FILENAME` is declared at line 41 and re-exported at line 59.
   - Repository-wide search found no consumer outside `gistConfig.ts`.

`GIST_MATCHMAKER_FILENAME` stays live via [src/hooks/useMatchmaker.ts](/Users/aaron/Documents/github/electron/src/hooks/useMatchmaker.ts#L4), so it should not be grouped with the dead constants above.

### Dormant domain models in shared types

These type models are defined in [src/types.ts](/Users/aaron/Documents/github/electron/src/types.ts), but repository-wide search found no consumers outside the type file itself:

1. [Message](/Users/aaron/Documents/github/electron/src/types.ts#L33)
2. [DailySpin](/Users/aaron/Documents/github/electron/src/types.ts#L41)
3. [SpinEntry](/Users/aaron/Documents/github/electron/src/types.ts#L49)
4. [SpinHistory](/Users/aaron/Documents/github/electron/src/types.ts#L59)

This is stronger than “not currently rendered”; these models have no active code paths at all.

### Unconsumed generated Supabase types

1. [src/integrations/supabase/types.ts](/Users/aaron/Documents/github/electron/src/integrations/supabase/types.ts#L1)
   - The file exports a large generated type surface beginning with `Json` and `Database` at lines 1-3.
   - It also exports helper aliases like [Tables](/Users/aaron/Documents/github/electron/src/integrations/supabase/types.ts#L683), [TablesInsert](/Users/aaron/Documents/github/electron/src/integrations/supabase/types.ts#L710), [TablesUpdate](/Users/aaron/Documents/github/electron/src/integrations/supabase/types.ts#L735), [Enums](/Users/aaron/Documents/github/electron/src/integrations/supabase/types.ts#L760), [CompositeTypes](/Users/aaron/Documents/github/electron/src/integrations/supabase/types.ts#L777), and [Constants](/Users/aaron/Documents/github/electron/src/integrations/supabase/types.ts#L794).
   - Repository-wide search found no imports or usages of these exports anywhere else in the repo.
   - This looks like generated scaffolding that is currently unintegrated into the app.

### Parked Supabase/edge-function scaffolding

1. [supabase/functions/omdb-proxy/deno.json](/Users/aaron/Documents/github/electron/supabase/functions/omdb-proxy/deno.json#L1)
   - The folder contains only `deno.json`; there is no `index.ts` or other function implementation.
   - Repository-wide search found no references to `omdb-proxy`.
   - This is scaffold residue, not executable code.

2. [supabase/config.toml](/Users/aaron/Documents/github/electron/supabase/config.toml#L1)
   - The file only contains `project_id`.
   - That is deployment metadata rather than application code, so it is not “dead code”, but it reinforces that the Supabase setup is mostly parked scaffolding in this repo state.

### What the second pass did not find

- No strong evidence of orphaned CSS selectors across the actively imported stylesheets.
- No evidence that Google Places env wiring is stale: `VITE_GOOGLE_PLACES_API_KEY` is live through [src/hooks/usePlacesAutocomplete.ts](/Users/aaron/Documents/github/electron/src/hooks/usePlacesAutocomplete.ts#L4) and [src/components/places/PlacesMap.tsx](/Users/aaron/Documents/github/electron/src/components/places/PlacesMap.tsx#L8).
