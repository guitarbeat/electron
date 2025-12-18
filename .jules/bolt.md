## 2024-05-23 - Watchlist Rendering Performance
**Learning:** Extracting list items into memoized components (`React.memo`) is crucial when the parent component manages frequently updating state (like a controlled input). Without this, every keystroke re-renders the entire list.
**Action:** When seeing `map` rendering complex components inside a component with controlled inputs, immediately suggest extracting the list item component. Ensure `useCallback` is used for any handlers passed to the child.
