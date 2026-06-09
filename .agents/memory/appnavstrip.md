---
name: AppNavStrip + UserAvatar merge
description: FlowNav and HeaderCommandDeck merged into AppNavStrip; UserAvatar extracted from ProfileMenu.
---

## Rules

### AppNavStrip
`src/components/ui/AppNavStrip.tsx` owns: brand wordmark + Movies/Places/Spin nav tabs + inline PWA status chip. Do not recreate FlowNav or HeaderCommandDeck — deleted. CSS in `AppNavStrip.css` under `--ans-*` token namespace.

### UserAvatar
`src/components/ui/UserAvatar.tsx` is the single avatar primitive: photo (with React useState img-error fallback) → initial letter → null placeholder. No size prop — sizes are controlled by parent CSS context (`.app-header__option-avatar` bumps to 2rem; default is 1.75rem).

### ProfileMenu
`src/components/ui/ProfileMenu.tsx` (185 lines): uses `<UserAvatar>` in both the trigger button and the profile list. Ghost wrapper div (`app-header__profile-wrap`) removed — component returns a fragment. The dropdown positions correctly because `.app-header__profile-menu` is `position: absolute` relative to `.app-header__right` which is `position: relative`.

### AppHeader.tsx
Thin 3-child shell: `<AppNavStrip>` (left) / center slot div / `<ProfileMenu>` (right). 71 lines.

## Why
Two goals: (1) eliminate cross-file token drift between FlowNav+HeaderCommandDeck, (2) de-duplicate the avatar() inline function which was defined once but called in two distinct render paths inside ProfileMenu (trigger + dropdown list).

## How to apply
- Nav/tabs/spin/sync chip → AppNavStrip.tsx + AppNavStrip.css
- Avatar rendering → UserAvatar.tsx
- Profile dropdown logic (PIN, user select, logout) → ProfileMenu.tsx
- Header layout/dropdown CSS → AppHeader.css

## Next strike target
`src/app/App.scss` — the monolith (~13k lines). Ghost CSS for deleted components may have accumulated. Safe first pass: grep for `.header-command-deck`, `.flownav`, `.seg-control` references and prune.
