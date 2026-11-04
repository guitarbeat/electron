# Implementation Plan: Toggles for Poster Badges & Dimming Watched Movies

Add independent switches in the bottom-left Settings menu to allow toggling poster watcher badges and watched movie dimming on or off, with persisted user preferences.

## User Requirements
1. **Two separate toggles**: "Poster badges" and "Dim watched".
2. **Placement**: Stacked alongside "Moving wall" and "Menu sounds" in the bottom-left Settings sheet.

---

## Proposed Changes

### 1. State Management & Persistence (`MovieSectionBody.tsx`)
- Add state for:
  - `showBadges` (boolean, defaults to `true`, initialized and stored in `localStorage` key `'movies-show-badges'`).
  - `dimWatched` (boolean, defaults to `true`, initialized and stored in `localStorage` key `'movies-dim-watched'`).
- Add helper setters that update React state and save to `localStorage`.
- Pass `data-show-badges={showBadges}` and `data-dim-watched={dimWatched}` to the wall/grid containers (`.movies-wall-container`).
- Pass `showBadges` and `dimWatched` flags into `MovieCard` props and render handlers.

### 2. Settings Menu Slot Updates (`LibrarySearch.tsx` & `MovieSectionBody.tsx`)
- Update `LibrarySearchProps` to accept the additional switch slots:
  - `badgeSlot`: `<SettingsSwitch label="Poster badges" checked={showBadges} onChange={setShowBadges} />`
  - `dimSlot`: `<SettingsSwitch label="Dim watched" checked={dimWatched} onChange={setDimWatched} />`
- Render the 4 switches neatly in the switches cluster inside `LibrarySearch.tsx` alongside `viewSlot` ("Moving wall") and `soundSlot` ("Menu sounds").

### 3. Poster Badges & Dimming Styling (`movies-shared.css` & `simple-library.css`)
- **Badge Visibility**:
  - In `MovieCard.tsx`: only render `<MediaCardWatcherStack />` when `showBadges` is `true`.
  - In `movies-shared.css`: add rule for `.movies-wall-container[data-show-badges="false"] .movie-item-watchers { display: none !important; }` to ensure all views immediately hide badges when toggled off.
- **Dimming Control**:
  - In `movies-shared.css`: when `[data-dim-watched="false"]` is active on `.movies-wall-container` or `.movie-item-card[data-dim-watched="false"]`, reset `.media-poster-wrap` filter to `none` and opacity to `1`.
- **Settings Layout**:
  - In `simple-library.css`: refine `.settings-menu__view` switches column into a compact 2-column or 2x2 grid so all 4 switches fit flush beside "Pick a movie", "Messages", and "Movie quiz" without expanding notch height.

---

## Verification Plan

### Automated Tests
- Run unit tests with `vitest`:
  - Update `LibrarySearch.test.tsx` and `MovieWallFilters.test.tsx` to verify new toggles render in the Settings slot.
  - Verify toggling switches updates the container attributes and local preferences.
- Run `compile_applet` and `lint_applet` to ensure zero compilation or lint errors.

### Manual Verification
- Open Settings notch via the bottom-left corner.
- Toggle "Poster badges" off: confirm watcher avatar badges in the poster corners disappear; toggle on: confirm badges return.
- Toggle "Dim watched" off: confirm watched movies retain full brightness and saturation; toggle on: confirm watched movies dim gently as expected.
- Reload the app to confirm user settings persist.
