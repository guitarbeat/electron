# Palette's Journal

## 2024-05-23 - TV Browser Optimization
**Learning:** This app is frequently used on TV browsers, which means focus management and keyboard/remote accessibility are critical.
**Action:** When adding interactive elements, always ensure `autoFocus` is used where appropriate, and that elements are focusable via tab index to support remote control navigation.

## 2024-05-23 - Toast Accessibility
**Learning:** Playwright's `get_by_text` is very strict and can fail if a Toast notification overlaps with the text being searched for.
**Action:** Use specific locators for Toasts (e.g., role='alert') and ensure they are marked as `aria-live="polite"` so screen readers announce them without stealing focus or causing tests to fail unpredictably.

## 2024-05-24 - List Memoization
**Learning:** Passing a parent handler that depends on the full list state to a memoized child component breaks optimization because the handler is recreated on every list change.
**Action:** Pass the item ID up to the handler, or move the logic into the child component if possible, so the parent handler can be stable (using `useCallback` with fewer dependencies).

## 2024-05-24 - Staggered Animations
**Learning:** Passing a calculated style object (e.g., `{ animationDelay: ... }`) to a memoized component breaks `React.memo` because the object reference changes every render.
**Action:** Pass the index as a primitive prop and let the child component calculate the style, or use a stable style object if the values don't change.
