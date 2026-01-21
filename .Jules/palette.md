## 2024-05-22 - Icon-Only Button Accessibility
**Learning:** `IconButton` components often rely solely on `title` props, which are insufficient for screen readers. The `Input` component also lacks intrinsic labeling when used without a visible label prop.
**Action:** Always explicitly add `aria-label` to `IconButton` and `Input` components when visible text labels are absent, rather than relying on `title` or `placeholder`.

## 2026-01-14 - Keyboard Feedback for Visual States
**Learning:** Interactive elements that change visually on hover (like `UserSelection` buttons) must also change on focus. Otherwise, keyboard users miss out on the same visual feedback that mouse users get.
**Action:** Always pair `onMouseEnter`/`onMouseLeave` with `onFocus`/`onBlur` handlers that trigger the same state changes.

## 2026-01-15 - Revealing Actions via Keyboard
**Learning:** Using inline `<style>` blocks in components allows for powerful pseudo-class usage like `:focus-within` to handle visibility of nested action buttons. This avoids O(N) state management in large lists for tracking "focused" items.
**Action:** Use CSS `:focus-within` on parent containers to reveal action buttons for keyboard users, matching the behavior of `:hover` for mouse users.
