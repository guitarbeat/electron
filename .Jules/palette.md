## 2026-06-18 - Added hover context to icon-only button
**Learning:** Icon-only buttons (like small '✕' clear indicators) often have `aria-label` for screen readers, but lack a `title` attribute, leaving mouse users without hover context. This is a common pattern in search inputs or clearable fields.
**Action:** When adding `aria-label` to icon-only interactive elements, ensure a `title` attribute is also present to provide tooltips for visual users.
