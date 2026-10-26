# High-Impact Interaction & Search Bug Remediation Plan

Resolves critical touch and pointer interaction bugs in the cinema DriftWall (touch-drag scrolling with drag-threshold tap protection, event listener scoping, and double-event suppression), fixes the broken search reveal navigation for saved places, adds resilient offline and zero-config fallbacks for movie search, and streamlines workspace typecheck performance.

## User Review & Critical Decisions

> [!IMPORTANT]
> Based on your clarifications, our top execution priority is eliminating high-impact interaction and search navigation bugs, with mobile touch configured for smooth drag-to-scroll and swipe-tap protection.

- **Confirmed Decision 1 (Remediation Scope)**: Target all high-impact interaction and search navigation bugs first, specifically DriftWall touch mechanics, event scoping, double-click suppression, place search navigation, and search fallback resiliency.
- **Confirmed Decision 2 (Mobile Touch Mechanics)**: Retain continuous serpentine auto-drift on desktop while enabling natural touch-drag velocity scrolling with strict drag-distance threshold protection ($>10\text{px}$) on mobile to completely prevent accidental movie modal popups when swiping.
- **Confirmed Decision 3 (Scoped Pointer & Gesture Boundaries)**: Confine all wheel and touch-event listeners to the `DriftWall` container element rather than `window`, preventing the movie canvas from hijacking scrolling across modals, navigation rails, and message boards.
- **Confirmed Decision 4 (Place Card Search Navigation)**: Add canonical `id="place-card-${place.id}"` and `data-place-id` DOM attributes to `PlaceCard` so `LibrarySearch` autocomplete instantly scrolls to and highlights the target place.

---

## 1. Overview & Core Concept

- **What It Does**: Hardens the multi-user cinema, place curation, and multimedia workspace by eliminating frustrating touch mis-taps, fixing broken search navigation, and preventing build verification timeouts.
- **Target Audience / Persona**: Aaron and Electra using the shared workspace on smartphones, tablets, laptops, and living-room smart TVs.
- **Key Value**: Swiping the movie wall on mobile feels fluid and never accidentally pops open cards; clicking a search result for a saved place reliably navigates to it; movie search remains resilient even without an OMDb API key; and builds compile cleanly without gateway timeouts.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Mobile Touch Wall Browsing**: On touchscreens, the user touches and drags vertically to flick through drifting cards. If the touch travel exceeds $10\text{px}$, tap gestures are suppressed so lifting a finger never accidentally opens a modal. Tapping directly without dragging ($<10\text{px}$) cleanly opens the Movie Details sheet.
  2. **Isolated Scrolling & Modal Isolation**: When a modal or side drawer is open, or when scrolling other tabs (Messages, Places list, Spin wheel), the DriftWall ignores external scroll/wheel inputs completely.
  3. **Instant Search-to-Place Navigation**: Typing a place name in the search bar (e.g. "The Cozy Bookstore") displays it in the autocomplete dropdown. Selecting it smoothly centers the exact place card in the viewport and triggers a brief sheen highlight.
  4. **Resilient Movie Search Fallback**: When searching for movies without an configured `OMDB_API_KEY`, the search seamlessly combines TVMaze and Wikipedia REST API summaries without presenting hard 500 server error toasts.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Retains the signature cyber-retro obsidian workspace aesthetic (`#050814` canvas, CRT entrance scanline, cyan `#00f0ff` and amber highlights).
  - *Touch Target Compliance*: All interactive hitboxes on mobile cards and controls adhere to $\ge 44 \times 44\text{px}$ touch targets.
- **Interactive Feedback & Motion**:
  - Smooth kinetic deceleration curves ($e^{-dt / \tau}$) for touch scrolling with natural momentum that gently blends back into the serpentine drift when released.
  - Single-fire modal transitions: Click events are deduplicated so modal mount animations trigger exactly once per user action.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Container-Scoped Event Listeners & Drag Guard in DriftWall**
  - *Chosen Approach*: Bind `wheel`, `touchstart`, `touchmove`, and `touchend` directly to `containerRef.current` (with `hasDraggedRef` tracking displacement $>10\text{px}$), and verify `!hasDraggedRef.current` before dispatching `onTileClick`.
  - *Why*: Eliminates window-level scroll hijacking and prevents accidental modal openings when swiping on mobile.
  - *Alternatives Considered*: Disabling drift entirely on mobile was rejected because users appreciate the kinetic ambient motion when idling.
- **Decision 2: Place Card DOM Identity & Search Pinpointing**
  - *Chosen Approach*: Assign `id={`place-card-${place.id}`}` and `data-place-id={place.id}` to `PlaceCard` in `apps/web/src/components/places/index.tsx`.
  - *Why*: Directly satisfies `LibrarySearch`'s `revealLibraryItem` query contract (`document.getElementById("place-card-" + selection.placeId)`).
- **Decision 3: Single-Origin Click Dispatching in MovieCard**
  - *Chosen Approach*: Let `MovieCard` stop event propagation or delegate tile activation cleanly through `onTileClick` without double-firing internal poster click and external custom-tile click handlers.
  - *Why*: Fixes redundant state updates and animation glitches during modal transitions.
- **Decision 4: Typecheck Optimization in Root Build Script**
  - *Chosen Approach*: Adjust `package.json` build scripts so incremental typechecks avoid redundant `--force` rebuilds of unchanged library references during standard app compilation.
  - *Why*: Prevents Cloud Run / Vite gateway timeouts (504s) during automated verification.

---

## 4. Technical Architecture & Data Strategy

- **Architecture & Component Diagram**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Library Workspace & Search Layer                     │
│  ┌───────────────────────┐         ┌─────────────────────────────────┐  │
│  │     CurvedInput       │         │        LibrarySearch            │  │
│  │ (Search Query String) │ ──────► │ (Autocomplete + Intent Routing) │  │
│  └───────────────────────┘         └────────────────┬────────────────┘  │
│                                                     │                   │
│                        ┌────────────────────────────┴─────────────────┐ │
│                        ▼                                              ▼ │
│          ┌───────────────────────────┐                  ┌─────────────┴─┐
│          │    revealLibraryItem()    │                  │  OMDb/TVMaze  │
│          │ • #place-card-{id} [FIX]  │                  │ Proxy & Fall- │
│          │ • Movie Details Hit-Area  │                  │ back Adapter  │
│          └─────────────┬─────────────┘                  └───────────────┘
└────────────────────────┼────────────────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  Cinema & DriftWall Interaction Canvas                  │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ containerRef (Scoped wheel / touch / pointer event listeners)     │  │
│  │                                                                   │  │
│  │  • touchStartPos ──► touchMove ──► hasDragged (dx/dy > 10px)      │  │
│  │  • momentum scroll decay ──► blend into serpentine drift offset   │  │
│  │  • touchend / click ──► guarded if (hasDragged) : SUPPRESS CLICK   │  │
│  │                                                                   │  │
│  │  ┌─────────────────────────┐     ┌─────────────────────────────┐  │  │
│  │  │   drift-wall__tile      │     │  MovieCard / PlaceCard      │  │  │
│  │  │   • data-tile-id        │     │  • id="place-card-{id}"     │  │  │
│  │  │   • Single-fire onClick │     │  • stopPropagation on tap   │  │  │
│  │  └─────────────────────────┘     └─────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State**:
  - **Touch & Gesture State**: Tracks `{ touchStartX, touchStartY, hasDragged, lastTouchY, scrollVelocity }` scoped strictly to the wall container ref.
  - **Tile Identity Mapping**: Explicit DOM `id` attributes assigned to place cards to mirror movie card data-attribute conventions.
- **Interactive Component & State Mapping**:
  - **`DriftWall.tsx`**: Attaches listeners to `containerRef.current` with passive flags; scales touch delta smoothly (`dy * 4` instead of `dy * 20`); blocks tile click events when `hasDraggedRef.current === true`.
  - **`MovieSectionBody.tsx` & `MovieCard.tsx`**: Harmonizes tile-level clicks so opening details executes once per user action.
  - **`places/index.tsx`**: Adds `id={`place-card-${place.id}`}` to enable search reveal navigation.
  - **`package.json`**: Optimizes `npm run build` and `typecheck` pipelines to prevent compilation timeouts.
