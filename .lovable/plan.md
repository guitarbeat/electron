

# Fix Snake Game Auto-Play & Build Error (2 changes, ~4 credits)

## Priority 1: Stop Snake from auto-playing and making noise on Extras tab
**Problem:** When you tap the Extras tab, the Snake game immediately starts running and playing move sounds -- even though you never intended to play. This is because `createInitialGameState` sets `status: 'running'` by default, and the game is rendered in "embedded" mode inside ExtrasHub.

**Fix:** In `SnakeGame.tsx`, when `mode === 'embedded'`, initialize the game state with `status: 'paused'` instead of `'running'`. The user will need to explicitly press Play/unpause to start the game. This is a small, targeted change:
- After creating the initial game state, override `status` to `'paused'` when embedded
- This prevents the game loop from ticking and playing sounds on load

**Files:** `components/snake/SnakeGame.tsx`

## Priority 2: Fix the vite.config.ts build error
**Problem:** `allowedHosts: 'all'` is a string, but Vite expects `true | string[]`. This causes a TypeScript build error.

**Fix:** Change `allowedHosts: 'all'` to `allowedHosts: true`.

**Files:** `vite.config.ts`

