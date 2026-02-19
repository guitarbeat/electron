## 2024-05-22 - [Optimizing List Renders]

**Learning:** `MovieItem` was memoized but received a new inline `onAddMemory` function on every `Watchlist` render, breaking memoization.
**Action:** Always wrap event handlers passed to list items in `useCallback` and ensure they don't depend on list item data directly (pass item data as argument).
