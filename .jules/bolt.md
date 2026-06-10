
## 2024-05-18 - [Optimizing array lookups inside loop iterations in React]
**Learning:** Found a specific O(N^2) performance bottleneck pattern in React `useEffect` hooks where developers iterate over an array (e.g., `movies.forEach`) and inside the loop perform another array iteration `previousMoviesRef.current?.find(...)` to correlate state updates. In React applications where array references are stable across large collections, this drastically increases complexity and time during renders.
**Action:** Always pre-compute a `Map` (or `Set`) object before an iteration loop when doing lookups to transform the problem into O(N) complexity instead of O(N^2).
