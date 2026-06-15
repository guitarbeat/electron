## 2024-06-08 - Tooltips for icon-only buttons
**Learning:** Some icon-only buttons like the close `✕` buttons in Toast and MoviesTopControls components had an `aria-label` but were missing `title` attributes for on-hover tooltips. This makes it difficult for sighted users to immediately understand what the "✕" does in contexts where it could mean "close" or "clear".
**Action:** Add `title` to icon-only buttons to improve accessibility and provide tooltip text.
