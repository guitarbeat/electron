## 2024-05-22 - [Optimized List Rendering]
**Learning:** Extracting list items to memoized components significantly reduces re-renders when parent state changes (like input typing).
**Action:** Always extract list items to separate components when the list is potentially large or complex.
