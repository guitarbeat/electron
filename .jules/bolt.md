## 2026-06-08 - O(N^2) hook optimization
**Learning:** Found an N+1/O(N^2) bottleneck pattern where React hooks (`useEffect`) iterate over state updates and perform `.find()` on previous state references. This degrades performance as collections grow.
**Action:** Pre-compute a `Map` or `Set` outside the loop to change O(N^2) array searches into O(N) linear time operations.
