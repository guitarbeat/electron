---
name: AppNavStrip + UserAvatar + CSS pruning + SCSS partials
description: FlowNav and HeaderCommandDeck merged into AppNavStrip; UserAvatar extracted; ghost CSS pruned; App.scss monolith split into partials.
---

## Component map (post-compression)

| File | Owns |
|---|---|
| `src/components/ui/AppNavStrip.tsx` + `AppNavStrip.css` | Brand wordmark + Movies/Places/Spin nav tabs + inline PWA status chip. Token namespace `--ans-*`. |
| `src/components/ui/UserAvatar.tsx` | Avatar primitive: photo → initial-letter fallback (React `useState` error) → null placeholder. No size prop — parent CSS controls dimensions. |
| `src/components/ui/ProfileMenu.tsx` | PIN/session logic + dropdown. Uses `<UserAvatar>`. Returns a React fragment (no wrapper div). |
| `src/app/AppHeader.tsx` | Thin 3-child shell: `<AppNavStrip>` / center-slot div / `<ProfileMenu>`. 71 lines. |
| `src/app/AppHeader.css` | Profile trigger, dropdown, avatars, menu actions. **620 lines** (was 640 — 20 pruned). |
| `src/app/App.scss` | Global layout + workspace chrome. **11,809 lines** (was 13,608 — 1,799 extracted to partials). |
| `src/app/y2k-skin.scss` | 643 lines: Y2K card overrides, Win98 suggestion/button chrome, section heading skin, Y2K palette `:root` tokens, Y2K ticker. |
| `src/app/workspace-polish.scss` | 1,154 lines: mobile touch targets, iOS zoom fix, modal docking, movies-unified-shell, workspace surfaces, 3D card tilt, tactile button utilities. |

## Import chain

`App.tsx` imports:
1. `./App.scss` (11,809 lines — core layout, workspace, watchlist styles)
2. `./y2k-skin.scss` (643 lines — Y2K theme overrides)
3. `./workspace-polish.scss` (1,154 lines — mobile + component polish)

## SCSS @use constraint (critical)
SCSS `@use` rules MUST appear before any other rules in a file — they cannot be appended mid-file. When splitting App.scss into partials, the partials must be imported via **TypeScript** `import './partial.scss'` in `App.tsx`, NOT via `@use` appended at the end of App.scss.

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
Continue splitting `workspace-polish.scss` (1,154 lines) into named sub-partials if further reduction is desired. Candidate split: `mobile-polish.scss` (touch targets/iOS/modals ~150 lines) + `movies-shell.scss` (movies-unified-shell ~270 lines) + `workspace-surfaces.scss` (~270 lines) + `card-utilities.scss` (3D tilt + tactile buttons ~350 lines).
