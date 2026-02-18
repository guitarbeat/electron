## 2024-05-23 - Prevent List Re-renders on Mutation

**Learning:** Passing global loading state (like `isSubmitting`) to every item in a large list forces the entire list to re-render whenever a mutation starts or ends. This is an O(N) performance hit for a simple action.
**Action:** Use `useRef` to track submission state for mutation guards in hooks, and remove `isSubmitting` props from list items. If button disabling is needed, rely on the guard or manage UI feedback more locally/optimistically, or accept that removing "disabled" visual state during short mutations is a worthy trade-off for performance.

## 2024-05-24 - Pause Polling on Hidden Tabs

**Learning:** Components wrapped in `display: none` for "tab" switching remain mounted and continue to execute effects like polling intervals. This consumes resources even when invisible.
**Action:** Implement an `isPaused` flag in polling hooks and pass visibility state (e.g., `activeTab !== 'queue'`) down to them to stop fetching when hidden, resuming automatically on visibility.
