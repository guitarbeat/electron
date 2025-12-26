## 2024-02-14 - IconButton Accessibility Pattern
**Learning:** `IconButton` components in this design system pass all props to the underlying `button`, allowing seamless integration of `aria-label`. However, many existing instances rely solely on `title`, which is insufficient for screen readers.
**Action:** Always explicitly add `aria-label` to `IconButton` usage, even if `title` is present. Ensure the label text provides context (e.g., dynamic state like "Switch User (Currently: Aaron)").
