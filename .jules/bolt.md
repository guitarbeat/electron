## 2025-10-27 - Missing Equality Check in Polling Hook

**Learning:** `usePolling` hook updates state every interval if no equality function is provided, even if data is identical. This causes massive re-renders in consumers like `MessageBoard`. Always check if polled data needs stable references.
**Action:** Add equality check (e.g., `JSON.stringify`) to `usePolling` calls when data comes from an API that returns new references.

## 2026-02-16 - Unstable Callbacks in List Rendering

**Learning:** Passing inline arrow functions (e.g., `onFixMatch={(m) => setMovieToFix(m)}`) to memoized list items (`MovieItem`) breaks memoization, causing all items to re-render on every parent state change (like typing in an input).
**Action:** Always wrap event handlers passed to memoized list components in `useCallback`.
