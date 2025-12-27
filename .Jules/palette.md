## 2024-05-24 - Accessibility Improvements for Watchlist

**Learning:**
Accessibility is not just about compliance but improving usability for everyone.
- Missing ARIA labels on icon-only buttons (like Logout) make them invisible to screen readers.
- Input fields without visible labels rely on placeholders, which vanish when typing. Adding `aria-label` ensures screen reader users always know what the input is for.
- Toast notifications need `role="alert"` (for errors) or `role="status"` (for success) to be announced immediately by screen readers.

**Action:**
- Verified usage of `aria-label` in `Watchlist.tsx` for key interactions.
- Added `aria-label` to the Logout button and Movie Input field.
- Added proper ARIA roles to toast notifications.
