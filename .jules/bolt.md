## 2024-05-23 - Watchlist Re-render Optimization
**Learning:** React list virtualization via `React.memo` requires strict prop stability. Extracting `MovieItem` was insufficient until `getWatchedStatus` logic was moved *inside* the child component, as passing it as a prop (even if memoized) was complex due to its dependency on `currentUser`. Also, handlers must be wrapped in `useCallback` to prevent breaking memoization on every parent render.
**Action:** When optimizing lists, prefer passing primitive data (ids, raw movie objects) to children and deriving UI state (like "watched by me") inside the child component to minimize prop instability. Ensure all callback props are stable.

## 2024-05-23 - Verification of Animated Transitions
**Learning:** Playwright scripts verified the UI but initially failed due to race conditions with CSS animations. The `UserSelection` -> `Watchlist` transition has a 400ms exit + 500ms enter delay.
**Action:** Verification scripts must use `page.wait_for_selector(..., state="hidden")` for the exiting component or wait for the entering component, rather than assuming immediate clicks work.
