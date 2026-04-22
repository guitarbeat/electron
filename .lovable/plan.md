
## Consolidate to a single chat/messages entry point

Right now the app shows two separate floating buttons that both open Messages:

- A standalone circular `.messages-fab` (bottom-left) — opens Messages directly.
- A draggable `RadialMenu` "+" toggle (bottom-right) that expands into 5 items, one of which is also "Open messages".

That's two FABs doing overlapping work, plus the radial menu also exposes Settings/Favorites/Help items that aren't wired up to anything (they call `handleMenuItemClick()` with no callback). It looks unfinished and clutters the corners.

### Proposed change

Keep **one** floating action button: a single Messages FAB anchored bottom-right. Remove the radial menu entirely from the main shell, and move its one real feature (background switcher: Moire ↔ Water) into a place it belongs — alongside the existing `ThemeToggle` in the **Shell Control Strip**.

```text
Before                          After
┌──────────────────────────┐    ┌──────────────────────────┐
│ [strip: profile|theme]   │    │ [strip: profile|theme|bg]│
│                          │    │                          │
│  workspace               │    │  workspace               │
│                          │    │                          │
│ 💬 (fab)         (+) ⚙  │    │                     💬   │
└──────────────────────────┘    └──────────────────────────┘
```

### What changes

1. **Remove `RadialMenu`** from `src/app/App.tsx` (the `<RadialMenu …/>` block and its lazy import). The component file itself stays on disk in case it's reused later, but it's no longer mounted.
2. **Keep one Messages FAB** — the existing `.messages-fab` button — but move it to the bottom-**right** corner so it sits where users expect a primary action and doesn't fight the workspace's left edge. Update `.messages-fab` styles in `src/app/App.scss` (`left` → `right`, mirror the mobile safe-area rule).
3. **Promote the background switcher** to first-class UI. Add a small icon toggle button (Moire/Water) into `ShellControlStrip` next to the existing `ThemeToggle`. Lift `backgroundType` state handling so the strip can read/update it — the simplest path is to pass `backgroundType` and `setBackgroundType` from `App.tsx` down through `AppHeader`/`ShellControlStrip` props, mirroring how `activeTab` is already threaded.
4. **Drop the dead menu items** (Settings/Favorites/Help) — they did nothing. No replacement needed.

### Files touched

- `src/app/App.tsx` — remove `RadialMenu` mount + lazy import; pass `backgroundType`/`setBackgroundType` into `AppHeader`.
- `src/app/AppHeader.tsx` — forward background props to `ShellControlStrip`.
- `src/app/ShellControlStrip.tsx` (+ `.css`) — add a small background-toggle icon button beside `ThemeToggle`.
- `src/app/App.scss` — reposition `.messages-fab` to bottom-right (desktop + mobile safe-area).
- `docs/SITE_LAYOUT.md` — update "Quick Actions" / shell strip description: background toggle now lives in the strip; no radial menu; one Messages FAB.

### Out of scope

- Not deleting `RadialMenu.tsx` / `.css` from disk (keeps the option to revive it).
- Not redesigning the Messages panel itself.
- Not changing how `WaterSimulation` / `MagicComponent` render — only how the user switches between them.

