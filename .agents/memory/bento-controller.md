---
name: BentoWorkspaceController
description: Unified search+stats+sort control surface used in both Movies and Places tabs
---

## Pattern

`BentoWorkspaceController` (`src/components/ui/BentoWorkspaceController.tsx`) wraps any TopControls component as `children` inside a single amber-bordered `<section>`. It adds:
- **Stat tiles row** — 3 glass tiles showing live section counts, clickable to smooth-scroll to their section
- **Sort chips row** — pill chips that cascade `SortOrder` state into the parent's `buildXxxSections()` call

## TopControls stripping rule

Both `MoviesTopControls` and `PlacesTopControls` were refactored to return `<>…</>` (React fragment) instead of `<section className="workspace-control-panel …">`. The `BentoWorkspaceController` provides that outer section. Do NOT re-add an outer section wrapper to either TopControls component.

**Why:** The bento owns the `workspace-control-panel` section element so both search and meta-controls share one unified border/background. Duplicating the section wrapper would break the visual enclosure.

## Section IDs

Stat tiles navigate by calling `document.getElementById(sectionId).scrollIntoView(…)`.
IDs follow the pattern `{tab}-section-{name}`:
- Movies: `movies-section-incoming`, `movies-section-queue`, `movies-section-watched`
- Places: `places-section-incoming`, `places-section-queue`, `places-section-visited`

These IDs are passed via `sectionIds` prop to `MovieSectionBody` and directly as `id=` on `CollectionSection` in `PlacesList`.

## Sort integration

`MovieSortOrder = 'recent' | 'alpha' | 'rating'` (rating sorts by `imdbRating` desc, fallback 0).
`PlaceSortOrder = 'recent' | 'alpha'`.
Sort state lives in `MoviesView` / `PlacesList`. It's passed as the third argument to `buildMovieSections` / `buildPlaceSections`, which sort a copy of the array before sectioning.

## Count animation

The `bento-stat-tile__count` span uses `key={tile.count}` — React remounts the span on count change, replaying the `@keyframes bento-count-tick` CSS animation (spring bounce from top).
