## 2025-02-15 - Array Iteration Pipeline Optimization in Autocomplete

**Learning:** When performing string mapping, deduplication, filtering, and slicing on potentially large datasets (like autocomplete suggestions), standard array pipelines (`[...new Set(arr)].map(...).filter(...).slice(0, K)`) allocate massive amounts of intermediate arrays and iterate over the entire set O(N) times.
**Action:** Convert multi-pass array pipelines into a single `for...of` loop with early termination (`if (results.length === K) break`). This drops execution time significantly (from O(N) multi-pass to O(K) single-pass) and eliminates all intermediate array garbage collection overhead.
