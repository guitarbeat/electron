## 2024-05-22 - [Polling Hook Re-renders]
**Learning:** `usePolling` triggers state updates (and thus re-renders) on every fetch if the fetch function returns a new object reference (like `JSON.parse` or `fetch` response), unless an `equalityFn` is provided.
**Action:** Always provide an equality function (e.g., `(prev, next) => JSON.stringify(prev) === JSON.stringify(next)`) when using `usePolling` with data sources that return new references.
