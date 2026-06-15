## 2025-06-09 - Accessibility standard for icon buttons
**Learning:** Adding `aria-label` to buttons is critical for accessibility. However, it's not strictly necessary for buttons that already have textual content, even if that content is purely symbolic (e.g., arrows) accompanied by words. Focus on buttons where the purpose isn't clear without visual context (like icon-only actions or non-descriptive labels).
**Action:** When searching for missing `aria-label`s, verify the button's content before blindly applying it to avoid redundant announcements for screen readers.
