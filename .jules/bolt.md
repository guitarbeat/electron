## 2024-05-23 - List Rendering Optimization
**Learning:** Extracting list items (like `MovieItem`) to separate memoized components is critical when the parent component has frequent state updates (like typing in a text input).
**Action:** Always check for anonymous functions or unstable props passed to list items, as these break `React.memo` optimization. Wrap handlers in `useCallback` and ensure dependencies are stable or that the child component can handle updates gracefully.
