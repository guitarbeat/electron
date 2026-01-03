# Bolt's Journal

## 2024-05-22 - [Refactoring List Items for Memoization]
**Learning:** When passing handlers to memoized list items (like `MovieItem`), avoid passing the entire list state or non-primitive derived data from the parent. This breaks memoization because the parent function recreates on every state change.
**Action:** Move derived logic (like `getWatchedStatus`) inside the child component, and pass only the item (or ID) to handlers, allowing the parent to use `useCallback` without depending on the specific item instance in the dependency array.

## 2024-05-22 - [Staggered Animations vs Memoization]
**Learning:** calculating `style={{ animationDelay: ... }}` in the parent and passing it to a `React.memo` component breaks memoization because the style object is a new reference every render.
**Action:** Pass the primitive `index` prop instead and let the child component (or a styled wrapper) calculate the delay, or use a stable style object if possible.
