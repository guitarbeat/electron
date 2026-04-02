

## Plan: Bigger Map with Overlaid Place Cards + Build Fix

### Build Fix
The `FetchResponse` interface in `api/_lib/retryFetch.ts` is missing `statusText`. Both `api/omdb.ts` and `api/tvmaze.ts` reference it. Fix: add `statusText: string` to the `FetchResponse` interface and include it in the `nodeFetch` response object (from `res.statusMessage`).

### Layout Redesign: Map-First with Overlaid Cards

Currently the Places tab shows: map at top, then card grids below in a vertical scroll. The new layout makes the map fill the entire workspace height, with place cards overlaid as a scrollable tray at the bottom of the map.

**Changes to `PlacesMap.tsx`:**
- Increase map height from `clamp(360px, 52vh, 580px)` to `100%` (fills parent).

**Changes to `PlacesList.tsx`:**
- Make the outer container fill the workspace (`height: 100%; position: relative; overflow: hidden`).
- Remove the separate card sections below the map.
- Instead, render place cards as an overlay panel inside the map container: a horizontally-scrollable row pinned to the bottom of the map area, with glass-morphism background.
- The overlay tray shows all places (to-try, visited, pinned) as compact cards. Tapping a pinned card flies the map to that location.
- Suggestions banner stays above the map if present.
- The SyncBanner stays at the top.

**Overlay tray design:**
- Position: absolute, bottom 0, full width, z-index above map but below pin panel.
- Horizontal scroll with snap, showing PlaceCard components at a smaller fixed width (~140px).
- Semi-transparent glass background matching the existing `glassStyle`.
- Drag handle at top to collapse/expand (optional, keep simple for now).

**Files to modify:**
1. `api/_lib/retryFetch.ts` — add `statusText` to `FetchResponse`
2. `src/components/places/PlacesList.tsx` — restructure layout: map fills container, cards overlay at bottom
3. `src/components/places/PlacesMap.tsx` — accept `height: 100%`, remove fixed clamp height

