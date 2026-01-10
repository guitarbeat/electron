## 2024-05-23 - React.memo Optimization Pattern
**Learning:** When optimizing list rendering in React, simply wrapping the child component in `React.memo` is insufficient if the parent passes inline functions or new object references as props. To make `React.memo` effective, all props passed to the memoized component must be stable. This requires:
1.  Wrapping handler functions in `useCallback`.
2.  Ensuring derived data passed as props is either primitive or memoized.
3.  Avoiding inline object creation (like `style={{...}}`) if possible, or moving style calculation inside the child component.
In this task, we successfully optimized the `Watchlist` by memoizing `MovieItem` and ensuring `handleToggleWatched` and `handleDeleteMovie` were stable references.

**Action:** When applying `React.memo`, always audit the props being passed. Use the React DevTools "Profiler" to identify why a memoized component is still re-rendering (e.g., "Props changed: onClick").
