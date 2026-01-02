## 2026-01-02 - Icon-Only Button Loading States
**Learning:** When using `Button` components for icon-only actions (like circular "Add" buttons), the default "Loading..." text causes significant layout shifts and breaks the circular shape.
**Action:** Use `loadingText=""` (empty string) prop on the `Button` component to suppress the text and show only the spinner, preserving the button's dimensions and shape during async operations.
