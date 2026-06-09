---
name: AppNavStrip merge
description: FlowNav and HeaderCommandDeck were merged into AppNavStrip. Token scale and class namespace established.
---

## Rule
`src/components/ui/AppNavStrip.tsx` is the single source for brand wordmark + Movies/Places/Spin nav tabs + PWA status chip. Do not recreate FlowNav or HeaderCommandDeck — they are deleted.

## Token namespace
All CSS lives in `AppNavStrip.css` under `--ans-*` token scale (accent, fg, bg, border, sep, h, r, pad, font).

## Why
Two separate components (FlowNav + HeaderCommandDeck) rendered side-by-side in AppHeader.__left with identical styling contracts. Merging eliminated cross-file token drift and reduced file count by 4.

## How to apply
When modifying header nav (tabs, brand, spin button, sync chip): edit `AppNavStrip.tsx` / `AppNavStrip.css` only. AppHeader.tsx is now a thin shell with 3 children: AppNavStrip, center slot div, ProfileMenu.

## Next strike target
`ProfileMenu.tsx` + dead selectors in `AppHeader.css` (`.header-command-deck__*` ghost refs, stale `.app-header__spin-trigger` if present).
