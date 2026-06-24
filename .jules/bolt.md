## 2026-06-24 - Array map/filter Set allocation bottleneck
**Learning:** When generating Sets from objects, chained array functions like `.map().filter()` create temporary intermediate arrays causing memory allocations. The `useCollection` hook was allocating new arrays on every poll sync event in `hasLocalOnlyRows`.
**Action:** Use a single-pass `for...of` loop and call `Set.prototype.add()` directly to shift the time/memory complexity and prevent redundant O(N) array allocation overhead.
