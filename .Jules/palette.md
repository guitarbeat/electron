## 2026-06-18 - Added hover context to icon-only button
**Learning:** Icon-only buttons (like small '✕' clear indicators) often have `aria-label` for screen readers, but lack a `title` attribute, leaving mouse users without hover context. This is a common pattern in search inputs or clearable fields.
**Action:** When adding `aria-label` to icon-only interactive elements, ensure a `title` attribute is also present to provide tooltips for visual users.

## 2026-06-18 - Tooltips for icon-only buttons
**Learning:** While `aria-label` attributes are correctly applied to most icon-only buttons in the application (like "Skip", "Keep", "Play again"), they often lack `title` attributes. This means that while screen readers can announce the button's purpose, sighted users relying on mice are left guessing what an icon does.
**Action:** When adding `aria-label` to icon-only buttons, always ensure a corresponding `title` attribute is added to provide a native hover tooltip for sighted users.

## 2024-06-17 - [Visual feedback and Screen Reader label in Map]
**Learning:** For floating or icon-based buttons that change state (like a drop-pin button that toggles 'Drop new pin' and 'Cancel drop pin'), dynamically updating the `aria-label` attribute accurately communicates the action's current intent to screen readers. For primary save actions, pairing disabled state with a visual `Spinner` inside the button provides immediate and satisfying visual feedback to users that an async action is happening.
**Action:** When working on toggle buttons with no text or map overlays, ensure `aria-label` updates depending on active state. Always include loading indicators alongside "Saving..." text for form submissions to improve perceived performance.
## 2026-06-21 - Replaced custom split user profile widget with MagicToggle for UI consolidation.

## 2026-06-23 - [Decorative emojis and semantic state]
**Learning:** When using emojis purely as visual indicators for state (e.g., checkboxes using ✅ or ◻), screen readers will read the literal names of the emojis out loud ("White Heavy Check Mark", "White Medium Square"). This creates noise if the component already conveys its state via semantic attributes like `aria-pressed="true"`.
**Action:** Always wrap decorative state-emojis in `<span aria-hidden="true">`, relying strictly on semantic attributes (like `aria-pressed`, `aria-checked`, or `aria-selected`) to convey the state to assistive technologies.
