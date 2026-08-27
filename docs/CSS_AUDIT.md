# CSS Styling & Bundle Audit

## 1. Overview
The workspace currently relies on four primary CSS files alongside Tailwind CSS. The CSS bundle (`dist/public/assets/index-*.css`) weighs in at **155KB**, which is unusually large for this application size. 

A deep dive into the CSS architecture reveals massive accumulation of dead code, legacy component styles, and CSS layouts that should be delegated to Tailwind.

### CSS File Breakdown:
- `apps/web/src/app/component-styles.css`: **6,382 lines** (Severe Bloat)
- `apps/web/src/app/globals.css`: **814 lines** (Moderate Bloat)
- `apps/web/src/components/ui/DriftWall.css`: **155 lines** (Necessary 3D Math)
- `apps/web/src/theme/theme.css`: **134 lines** (Theme Variables - OK)

## 2. Unused CSS (Dead Code)
There are no completely unused *files*, but `component-styles.css` and `globals.css` act as dumping grounds for deleted components. 

Our automated audit extracted **182 completely orphaned CSS classes** that are no longer referenced anywhere in the TypeScript codebase.

**Notable Dead Code Examples:**
- **Legacy Headers**: `app-header__*` (22 classes, likely replaced by Tailwind headers).
- **Dead Loading States**: `drift-wall-loading__*` (DriftWall now handles its own loading state or doesn't use these specific BEM classes).
- **Deleted Bento Grids**: `bento-*` components (Stats, grids, sort labels).
- **Legacy Cards**: `.movie-card`, `.places-item-card`, `.media-card-info`. (The codebase now uses `.movie-item-card`).
- **Misc UI**: `.memory-lane-divider`, `.tabular-nums`, `.chat-fab__status`.

## 3. Styling Inconsistencies & Tailwind Candidates
The codebase mixes Tailwind utility classes with traditional BEM CSS architecture. This causes specificity clashes and bundle bloat.

**Top Candidates for Tailwind Conversion:**
1. **`.workspace-search__autocomplete` (in `globals.css`)**
   - *Current:* Uses custom absolute positioning, borders, padding, and flexbox.
   - *Fix:* Convert to `absolute top-[calc(100%+0.45rem)] inset-x-0 max-h-96 rounded-2xl bg-surface/95 flex flex-col`.
2. **`.pin-dialog-overlay` & `.pin-dialog-panel`**
   - *Current:* Hardcoded flex centering, backdrop-filters, and media queries.
   - *Fix:* Convert to `fixed inset-0 z-[10100] flex items-center justify-center backdrop-blur-md`.
3. **`.collection-grid`**
   - *Current:* Uses custom `grid-template-columns: repeat(auto-fill, minmax(170px, 1fr))`.
   - *Fix:* Can easily be moved to a custom Tailwind configuration or directly inline as `grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))]`.

## 4. Recommended Action Plan
1. **Purge Dead Code**: Run a script to surgically remove the 182 unused BEM blocks from `component-styles.css`. This is estimated to drop the bundle size by at least 25%.
2. **Refactor Modals/Dropdowns**: Move the `WorkspaceSearch` and `PinDialog` CSS directly into their React components using Tailwind classes.
3. **Keep `DriftWall.css` and `theme.css`**: `theme.css` correctly manages CSS variables for light/dark/theme switching. `DriftWall.css` contains complex 3D math and `webkit-mask-image` properties that are impractical to write as raw Tailwind utilities.
