## 2026-06-23 - Convert Array.find to Map.get for optimization
Converted O(N * M) Array.find calls inside a loop to O(N + M) map lookup by creating a Map beforehand. Execution time on mock 1000 questions / 10000 answers dropped from ~100ms to ~11ms.
