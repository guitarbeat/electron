## 2024-05-22 - Icon-Only Button Accessibility

**Learning:** `IconButton` components often rely solely on `title` props, which are insufficient for screen readers. The `Input` component also lacks intrinsic labeling when used without a visible label prop.
**Action:** Always explicitly add `aria-label` to `IconButton` and `Input` components when visible text labels are absent, rather than relying on `title` or `placeholder`.

## 2026-01-14 - Keyboard Feedback for Visual States

**Learning:** Interactive elements that change visually on hover (like `UserSelection` buttons) must also change on focus. Otherwise, keyboard users miss out on the same visual feedback that mouse users get.
**Action:** Always pair `onMouseEnter`/`onMouseLeave` with `onFocus`/`onBlur` handlers that trigger the same state changes.

## 2026-02-20 - Hidden Actions Accessibility

**Learning:** Action buttons hidden by default (e.g., show on hover) must be revealed when they or their container receive focus. Inline styles like `opacity: 0` override CSS pseudo-classes (`:hover`, `:focus-within`), breaking this behavior.
**Action:** Use CSS classes instead of inline styles for default hidden states, and use `:focus-within` alongside `:hover` to reveal actions for keyboard users.

- **Case-Insensitive Styling**: Updated in to case-insensitively match user names 'Aaron' and 'Electra' to their specific style variants, ensuring consistent styling regardless of capitalization.
- **Case-Insensitive Styling**: Updated `getStyleForUser` in `MessageItem.tsx` to case-insensitively match user names 'Aaron' and 'Electra' to their specific style variants, ensuring consistent styling regardless of capitalization.

## 2026-03-01 - Dynamic ARIA Labels in Lists

**Learning:** `IconButton`s in repeated lists (like movie items) often lack context if their `aria-label` is static (e.g., "Delete"). Screen readers announce "Delete" repeatedly, confusing users about which item is targeted.
**Action:** Incorporate the item's name into the `aria-label` (e.g., "Delete The Matrix") to provide specific context for each action.

## 2026-03-05 - Async Action Feedback

**Learning:** Users lack feedback during async operations like "Mark as Watched", which feels unresponsive on slow networks.
**Action:** Implement local `isUpdating` state in components to show loading spinners on buttons immediately, even if the parent manages the actual data mutation.
