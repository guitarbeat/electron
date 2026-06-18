## 2026-06-18 - Added hover context to icon-only button
**Learning:** Icon-only buttons (like small '✕' clear indicators) often have `aria-label` for screen readers, but lack a `title` attribute, leaving mouse users without hover context. This is a common pattern in search inputs or clearable fields.
**Action:** When adding `aria-label` to icon-only interactive elements, ensure a `title` attribute is also present to provide tooltips for visual users.

## 2026-06-18 - Tooltips for icon-only buttons
**Learning:** While `aria-label` attributes are correctly applied to most icon-only buttons in the application (like "Skip", "Keep", "Play again"), they often lack `title` attributes. This means that while screen readers can announce the button's purpose, sighted users relying on mice are left guessing what an icon does.
**Action:** When adding `aria-label` to icon-only buttons, always ensure a corresponding `title` attribute is added to provide a native hover tooltip for sighted users.
