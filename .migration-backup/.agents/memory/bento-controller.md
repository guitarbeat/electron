---
name: BentoWorkspaceController
description: Unified workspace chrome — nav, profile, search, and optional view controls for Movies and Places tabs
---

## Pattern

`BentoWorkspaceController` (`src/components/ui/BentoWorkspaceController.tsx`) is the single sticky workspace shell. It renders:

- **Topbar** — `AppNavStrip` (brand + Movies/Places/Spin tabs) and `ProfileMenu`; on mobile, a `?` shortcuts icon lives in the topbar
- **Search slot** — TopControls (`MoviesTopControls` / `PlacesTopControls`) portaled as `children`
- **View controls** — `ViewModeControls` (movies only, when view modes are configured)
- **Shortcuts row** — desktop-only footer button opening keyboard-help modal

Styles: `BentoWorkspaceController.css` (shell) + `WorkspaceTopbar.css` (profile menu; legacy `app-header__*` class names on `ProfileMenu`).

## TopControls stripping rule

Both `MoviesTopControls` and `PlacesTopControls` return `<>…</>` (React fragment), not an outer `<section>`. The bento owns the `bento-ctrl` section element. Do NOT re-add an outer section wrapper to either TopControls component.

## Section IDs

Keyboard shortcuts 1–3 jump to workspace sections via `document.getElementById(sectionId).scrollIntoView(…)`.
IDs follow `{tab}-section-{name}`:

- Movies: `movies-section-incoming`, `movies-section-queue`, `movies-section-watched`
- Places: `places-section-incoming`, `places-section-queue`, `places-section-visited`

Passed via `sectionIds` to `MovieSectionBody` and as `id=` on `CollectionSection` in `PlacesList`.

## Sorting (internal only)

Lists still sort with default `"recent"` inside `buildMovieSections` / `buildPlaceSections`. There is no sort UI in the chrome.

## Wiring

`AppWorkspaceShell` passes header props (`activeTab`, `onTabChange`, profile/session) into `BentoWorkspaceController`. `App.tsx` no longer renders a separate header component.
