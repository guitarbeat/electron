## 2026-06-23 - Convert Array.find to Map.get for optimization
Converted O(N * M) Array.find calls inside a loop to O(N + M) map lookup by creating a Map beforehand. Execution time on mock 1000 questions / 10000 answers dropped from ~100ms to ~11ms.

## 2024-06-14 - Test concurrentMap
Testing concurrency logic can be tricky. It is useful to use promises to 'hang' worker threads to carefully assert the maximum active concurrent tasks logic.

## 2026-06-23 - Test useSyncExternalStore in Node
When testing React hooks that rely on `useSyncExternalStore` natively in a `node:test` environment without full DOM or Testing Library, intercept `React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE.H.useSyncExternalStore` rather than mocking `React.useSyncExternalStore` directly, since hooks are imported as destructured module components.

## 2026-06-24 - Array map/filter Set allocation bottleneck
**Learning:** When generating Sets from objects, chained array functions like `.map().filter()` create temporary intermediate arrays causing memory allocations. The `useCollection` hook was allocating new arrays on every poll sync event in `hasLocalOnlyRows`.
**Action:** Use a single-pass `for...of` loop and call `Set.prototype.add()` directly to shift the time/memory complexity and prevent redundant O(N) array allocation overhead.
