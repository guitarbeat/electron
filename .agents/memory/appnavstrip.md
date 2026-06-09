---
name: AppNavStrip + UserAvatar + CSS pruning
description: FlowNav and HeaderCommandDeck merged into AppNavStrip; UserAvatar extracted from ProfileMenu; ghost CSS pruned from AppHeader.css.
---

## Component map (post-compression)

| File | Owns |
|---|---|
| `src/components/ui/AppNavStrip.tsx` + `AppNavStrip.css` | Brand wordmark + Movies/Places/Spin nav tabs + inline PWA status chip. Token namespace `--ans-*`. |
| `src/components/ui/UserAvatar.tsx` | Avatar primitive: photo → initial-letter fallback (React `useState` error) → null placeholder. No size prop — parent CSS controls dimensions. |
| `src/components/ui/ProfileMenu.tsx` | PIN/session logic + dropdown. Uses `<UserAvatar>`. Returns a React fragment (no wrapper div). |
| `src/app/AppHeader.tsx` | Thin 3-child shell: `<AppNavStrip>` / center-slot div / `<ProfileMenu>`. 71 lines. |
| `src/app/AppHeader.css` | Profile trigger, dropdown, avatars, menu actions. **620 lines** (was 640 — 20 pruned). |

## Deleted files
`FlowNav.tsx`, `FlowNav.css`, `HeaderCommandDeck.tsx`, `HeaderCommandDeck.css` — all gone, zero refs remain.

## AppHeader.css pruned selectors
These were styled but never applied in any TSX after the FlowNav migration:
- `.app-header__brand` (4 responsive overrides across 640px / 600px / 380px / 768px breakpoints)
- `.app-header__brand-kicker` (2 responsive overrides across 640px / 600px)
- `.app-header__option-lock` (standalone rule — LockIcon SVG is rendered directly with no class)

## Key rules
- Brand font-size responsive rules now live exclusively in `AppNavStrip.css` under `.ans__brand`
- Avatar img error-fallback is React-controlled state in `UserAvatar.tsx` (not DOM manipulation)
- Dropdown `position: absolute; right: 0` anchors to `.app-header__right` (has `position: relative`)

## Next strike target
`src/app/App.scss` deeper audit — the 13k-line monolith. Strategy: grep for component-level selectors that reference patterns from removed features (e.g. old spin-button placement, legacy tab nav patterns pre-AppNavStrip). Also check if `App.scss` has Y2K skin overrides targeting `.app-header__brand` or `.flownav` (confirmed none exist — audit passed clean).
