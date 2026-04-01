

## Build Error Fix Plan

The preview fails due to 10+ TypeScript errors across multiple files. Here is each fix:

### 1. `src/hooks/index.ts` — Remove missing `useModal` export
Line 7 exports `./useModal` which doesn't exist. Remove that line.

### 2. `src/hooks/useQuiz.ts` — Fix re-export path
Line 16: `export type { QuizData } from '@/services/stateTypes'` should be `'@/services/state/stateTypes'`.

### 3. `src/hooks/places/usePlaceSuggestions.ts` — Fix relative import
Line 3: `'../shared/types.ts'` should be `'@/shared/types'` (the relative path is wrong from hooks/places/).

### 4. `src/app/buildMinigameModals.tsx` — Add missing `title` to messages modal
The `messages` modal config (line ~65) is missing `title: 'Messages'`.

### 5. `src/components/matchmaker/matchmakerGame.ts` — Fix shuffleArray call
Line 76: `shuffleArray(arr, randomSource)` passes 2 args but the imported `shuffleArray` only accepts 1. Remove the `randomSource` parameter from `createMatchmakerPool` signature and the second argument from the call.

### 6. `src/components/watchlist/WatchlistTopControls.tsx` — Fix `posterUrl` → `poster`
Lines 428/430: Change `result.posterUrl` to `result.poster` to match `MovieAutocompleteResult`.

### 7. `src/services/metadata/omdb.ts` — Add types to `.map` callbacks
Lines 105-106: Add `: string` type annotation to `actor` and `genre` parameters.

### 8. `src/services/content/pinHelpers.ts` — Fix type assertion in `isUserPinsRecord`
Line 29-30: Cast `value` as `Record<string, unknown>` to fix index signature error.

### 9. Test file import fixes (4 files)
These test files use `.ts` extensions in imports that fail resolution:
- `src/api/spinWheelState.test.ts`: Change `'../services/stateSchemas.ts'` → `'../services/state/stateSchemas'`, add type to `entry` param
- `src/services/messageService.test.ts`: `'./messageService.ts'` → `'./content/messageService'`
- `src/services/metadataService.test.ts`: `'./metadataService.ts'` → `'./metadata/metadataService'`, type the `result` param
- `src/services/stateClient.test.ts`: `'./stateClient.ts'` → `'./state/stateClient'`
- `src/services/stateSchemas.test.ts`: `'./stateSchemas.ts'` → `'./state/stateSchemas'`

### Technical Details
All changes are single-line or few-line fixes. No architectural changes. No removal of Vercel or Replit code.

