## 2026-01-02 - Memoized List Rendering
**Learning:** React re-renders all list items when parent state changes (e.g., input typing) if items are defined inline. Extracting items to `React.memo` components prevents this.
**Action:** Always extract complex list items to separate, memoized components. Ensure callbacks passed to them are stable (use `useCallback`) and avoid passing new objects/arrays as props.
