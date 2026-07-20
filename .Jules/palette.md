## 2026-06-18 - Added hover context to icon-only button
**Learning:** Icon-only buttons (like small '✕' clear indicators) often have `aria-label` for screen readers, but lack a `title` attribute, leaving mouse users without hover context. This is a common pattern in search inputs or clearable fields.
**Action:** When adding `aria-label` to icon-only interactive elements, ensure a `title` attribute is also present to provide tooltips for visual users.

## 2026-06-18 - Tooltips for icon-only buttons
**Learning:** While `aria-label` attributes are correctly applied to most icon-only buttons in the application (like "Skip", "Keep", "Play again"), they often lack `title` attributes. This means that while screen readers can announce the button's purpose, sighted users relying on mice are left guessing what an icon does.
**Action:** When adding `aria-label` to icon-only buttons, always ensure a corresponding `title` attribute is added to provide a native hover tooltip for sighted users.

## 2024-06-17 - [Visual feedback and Screen Reader label in Map]
**Learning:** For floating or icon-based buttons that change state (like a drop-pin button that toggles 'Drop new pin' and 'Cancel drop pin'), dynamically updating the `aria-label` attribute accurately communicates the action's current intent to screen readers. For primary save actions, pairing disabled state with a visual `Spinner` inside the button provides immediate and satisfying visual feedback to users that an async action is happening.
**Action:** When working on toggle buttons with no text or map overlays, ensure `aria-label` updates depending on active state. Always include loading indicators alongside "Saving..." text for form submissions to improve perceived performance.
## 2026-06-23 - Input Placeholder Accessibility
**Learning:** Input elements relying solely on `placeholder` attributes are insufficient for screen readers; always provide an explicit `aria-label` or associated `<label>` to guarantee accessibility.
**Action:** When adding new input fields, always ensure an explicit label is present rather than relying solely on placeholder text.
