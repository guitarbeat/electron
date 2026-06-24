## 2025-02-15 - Array Iteration Pipeline Optimization in Autocomplete

**Learning:** When performing string mapping, deduplication, filtering, and slicing on potentially large datasets (like autocomplete suggestions), standard array pipelines (`[...new Set(arr)].map(...).filter(...).slice(0, K)`) allocate massive amounts of intermediate arrays and iterate over the entire set O(N) times.
**Action:** Convert multi-pass array pipelines into a single `for...of` loop with early termination (`if (results.length === K) break`). This drops execution time significantly (from O(N) multi-pass to O(K) single-pass) and eliminates all intermediate array garbage collection overhead.

## 2024-06-14 - Test concurrentMap

Testing concurrency logic can be tricky. It is useful to use promises to 'hang' worker threads to carefully assert the maximum active concurrent tasks logic.

## 2026-06-16 - Optimization of array mapping in useMovies

**Learning:** Found an inefficient nested operation `O(N*M)` caused by calling `.map()` in a `for` loop which creates repeated array allocations.
**Action:** Replaced the array logic with `Set` and `Map` to accomplish the exact same array operations in `O(N+M)` time with minimal array memory allocations.
