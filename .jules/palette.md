## 2024-06-13 - Redundant ARIA Labels
**Learning:** Adding an `aria-label` to a button that already has visible text (like `{actionLabel}` inside the button) is redundant and does not actually improve accessibility, as screen readers automatically derive the accessible name from the text content. `aria-label`s should primarily be used for icon-only buttons.
**Action:** Before adding an `aria-label` to a button, always verify whether the button already has clear visible text content. Only add `aria-label`s to buttons that lack visible text, such as icon-only buttons.
