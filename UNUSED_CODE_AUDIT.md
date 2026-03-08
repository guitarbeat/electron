# Unused Code Audit

Status: resolved on `codex/minimalist-shell`

This document now records what was removed or integrated after the unused-code audit passes. The original findings have been addressed in code.

## Removed

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

## Integrated

- Tightened shared app types in `src/types.ts`
  - removed dead `MainTab` variants
  - removed dormant `Message`, `DailySpin`, `SpinEntry`, and `SpinHistory` models
  - trimmed quiz re-exports to the ones actually consumed through `@/types`

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

## Verification

Current branch verification after cleanup:

- `npm run lint`: clean
- `npm run build`: passes
- `npm run test:all`: passes
- `npx --yes knip`: clean
- `npx --yes depcheck`: no issues

If another audit is needed later, start from the current branch state rather than the earlier findings list.
