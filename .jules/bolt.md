## 2025-05-23 - List Rendering Optimization
**Learning:** Extracting list items into memoized components is crucial for performance in React apps with frequent updates (like polling or typing).
**Action:** When rendering lists that depend on complex state or frequent updates, always extract the item into a `React.memo` component and ensure props (especially handlers) are stable.
