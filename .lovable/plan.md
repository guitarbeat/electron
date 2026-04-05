

## Comprehensive Places Tab Improvement Plan

### Current Issues
The Places tab currently has:
- No explicit height on the workspace surface, so the map + overlay layout doesn't fill the viewport
- Basic place cards with no rich details (no photos, no ratings)
- No empty state when there are zero places
- No active card highlighting when flying to a place
- Tray is not collapsible — covers map permanently
- No category filtering or visual grouping beyond "to try" / "visited"
- Map markers are plain dots with no labels or popups

### Changes

#### 1. Fix workspace height so map fills viewport
**File: `src/app/App.scss`**
Add `min-height: 70vh` to `.workspace-surface--places` so the PlacesList container actually gets height to fill.

#### 2. Collapsible bottom tray with drag gesture
**File: `src/components/places/PlacesList.tsx`**
- Add a `trayExpanded` state (default `true`).
- Clicking the drag handle toggles between expanded (shows cards) and collapsed (shows only the handle bar, ~20px tall).
- Smooth CSS transition on `max-height` for the card area.
- When collapsed, the map gets full visibility.

#### 3. Active card highlight on fly-to
**File: `src/components/places/PlacesList.tsx`**
- Track `activeCardId` state. Set it when a card is tapped. Clear after 2s.
- Pass `isActive` prop to PlaceCard; apply a subtle accent border glow.
- Auto-scroll the tray to center the active card using `scrollIntoView`.

#### 4. Map marker popups
**File: `src/components/places/PlacesMap.tsx`**
- When creating markers, attach a MapLibre `Popup` with the place name, icon, and a "Visited" badge if applicable.
- Style the popup with the glass-morphism theme.

#### 5. Better empty state
**File: `src/components/places/PlacesList.tsx`**
- When `!isLoading && places.length === 0`, show a centered overlay on the map with an illustration/icon, a message like "No places yet — search to add your first spot", and a subtle animation.

#### 6. Card design upgrade
**File: `src/components/places/PlaceCard.tsx`**
- Make the icon larger and add a subtle gradient background behind it based on place category.
- Show coordinates as a tiny "lat, lng" label when pinned.
- Add a subtle hover lift animation with `transform: translateY(-2px)` and glow.
- Show "Added by Aaron/Electra" if `addedBy` is available.

#### 7. Category color coding
**File: `src/components/places/PlaceCard.tsx`**
- Map the `getPlaceIcon` categories to accent colors (e.g., food = warm orange, nature = green, culture = purple).
- Apply as a thin left border or top gradient stripe on the card.

#### 8. Smooth transitions
**File: `src/components/places/PlacesList.tsx`**
- Add `transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)` on the tray container.
- Cards entering the tray get a staggered fade-in using CSS `animation-delay`.

### Technical Details

**Files modified:**
1. `src/app/App.scss` — workspace-surface--places height
2. `src/components/places/PlacesList.tsx` — collapsible tray, active card,