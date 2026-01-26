## 2024-05-23 - Prevent List Re-renders on Mutation

**Learning:** Passing global loading state (like `isSubmitting`) to every item in a large list forces the entire list to re-render whenever a mutation starts or ends. This is an O(N) performance hit for a simple action.
**Action:** Use `useRef` to track submission state for mutation guards in hooks, and remove `isSubmitting` props from list items. If button disabling is needed, rely on the guard or manage UI feedback more locally/optimistically, or accept that removing "disabled" visual state during short mutations is a worthy trade-off for performance.
