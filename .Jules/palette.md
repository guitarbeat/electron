## 2024-06-24 - Grouping independent actions in Magic Toggle
- Context: When combining disjoint actions (like sound toggles and setting modals) into a grouped interface that visually matches MagicToggle, avoid using the actual MagicToggle component because it implies mutually exclusive state via indicators and semantic aria-pressed values on the active item.
- Approach: Created a `MagicButtonGroup` component that visually maps the actions onto a shared `role="group"` background without a moving selection indicator. It supports `ariaPressed` correctly for boolean toggle actions without enforcing it across all items, thus avoiding false positives on semantic grouping.

## 2026-06-20 - UI Prune: Unified MagicToggle and Search Elements
Unified scattered inputs and UI toggles using reusable components like MagicToggle. Maintained focus management logic where required.
