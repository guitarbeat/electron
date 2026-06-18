
## 2026-06-18 - Tooltips for icon-only buttons
**Learning:** While `aria-label` attributes are correctly applied to most icon-only buttons in the application (like "Skip", "Keep", "Play again"), they often lack `title` attributes. This means that while screen readers can announce the button's purpose, sighted users relying on mice are left guessing what an icon does.
**Action:** When adding `aria-label` to icon-only buttons, always ensure a corresponding `title` attribute is added to provide a native hover tooltip for sighted users.
