## 2024-06-08 - O(N^2) Bottlenecks in useEffect
**Learning:** Nested array `.find()` lookups against previous React refs inside `useEffect` collection iterations cause silent O(N^2) bottlenecks as the collection grows.
**Action:** Always extract lookup targets from the ref into an O(1) structure (like a `Set` or `Map`) before iterating over the current collection.
