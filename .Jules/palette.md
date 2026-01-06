## 2024-05-22 - Icon-Only Button Accessibility
**Learning:** `IconButton` components often rely solely on `title` props, which are insufficient for screen readers. The `Input` component also lacks intrinsic labeling when used without a visible label prop.
**Action:** Always explicitly add `aria-label` to `IconButton` and `Input` components when visible text labels are absent, rather than relying on `title` or `placeholder`.
