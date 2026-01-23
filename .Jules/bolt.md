## 2024-05-23 - Redundant Confirmation Anti-Pattern
**Learning:** Logic for user confirmation (e.g., `window.confirm`) should live in the UI layer (components), not the data layer (hooks), especially when custom UI dialogs are used. Putting it in the hook forces a specific interaction model and can lead to double-confirmations if the UI also implements a check.
**Action:** Keep data hooks pure (just perform the mutation). Let the component decide how/when to ask for confirmation.

## 2024-05-23 - Derived State in Interactive Components
**Learning:** In components with frequent state updates (like controlled inputs), derived calculations (filtering/sorting lists) run on every render.
**Action:** Use `useMemo` for derived data, especially list transformations, to decouple list processing from input state updates.
