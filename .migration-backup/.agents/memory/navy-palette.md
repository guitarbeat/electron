---
name: Navy palette migration
description: Warm amber/brown → dark navy (#07091a) + pink (#f472b6) + sky blue (#7dd3fc) repalette; which files were touched and the Y2K exception.
---

# Navy palette migration

## The rule
Default theme uses dark navy `#07091a` backgrounds, `#f472b6` (pink) and `#7dd3fc` (sky blue) accents. Replace warm amber/brown everywhere EXCEPT inside `.theme-y2k` selectors — those are intentional Win98 sepia.

**Why:** Moiré background uses `color1="#ff6eb4"` and `color2="#7dd3fc"`. The old warm-amber palette clashed visually.

## How to apply
- Warm dark bg: `rgba(58,41,25,…)` → `rgba(14,22,58,…)` or `rgba(8,12,36,…)`
- Warm border: `rgba(212,177,115,…)` → `rgba(148,163,200,…)`
- Warm highlight: `rgba(245,185,90,…)` → `rgba(244,114,182,…)`
- Warm text: `rgba(230,212,182,…)` → `rgba(180,200,240,…)`
- CSS var fallback `#c88d59` → `#f472b6`
- Completed/visited accent: sky blue `#7dd3fc` (replaces green tones)

## Key files changed (non-Y2K sections only)
- `src/theme/themes.ts` — full rewrite with navy palette
- `src/app/App.scss` — ~60+ warm values outside Y2K block (~line 11025+)
- `src/app/workspace-polish.scss` — hero text, stat borders, autocomplete bg, card shadows
- `src/components/ui/BentoWorkspaceController.css` — stat tiles, separator, sort chips (was all `rgba(245,185,90,…)`)
- `src/components/effects/RadialMenu.css` — tooltip/context-bubble/toggle backgrounds
- `src/app/WorkspaceErrorBoundary.tsx` — inline styles on error card
- `src/app/WorkspaceTopbar.css` — profile menu bg `#1a1410` → `#0a0f2e`; fallback `#c88d59` → `#f472b6`
- `src/components/ui/AppNavStrip.css` — brand gradient fallback + `--ans-fg` text colors

## Y2K skin exception
Lines inside `.theme-y2k { … }` in App.scss (~line 11025+), `src/app/y2k-skin.scss`, and `.theme-y2k` blocks in component CSS are intentionally warm/sepia. Do not change them.
