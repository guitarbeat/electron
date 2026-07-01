## 2026-06-23 - Convert Array.find to Map.get for optimization
Converted O(N * M) Array.find calls inside a loop to O(N + M) map lookup by creating a Map beforehand. Execution time on mock 1000 questions / 10000 answers dropped from ~100ms to ~11ms.

## 2024-06-14 - Test concurrentMap
Testing concurrency logic can be tricky. It is useful to use promises to 'hang' worker threads to carefully assert the maximum active concurrent tasks logic.
