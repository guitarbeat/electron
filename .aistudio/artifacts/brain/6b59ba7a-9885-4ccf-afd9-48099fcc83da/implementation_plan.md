# Frameless In-Place Poster Booklets

Every movie poster on the wall now acts as a physical booklet where it sits: closed posters occupy a single poster slot (`1 column × 1 row`), and clicking or swiping a poster flips its cover open in-place across **2 poster columns at the exact same 1-row poster height**—with no outer frame box, no floating close button, and no `Cover | Spread | Fold closed` button bar.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following design and interaction choices reflect your direct feedback and confirmed preferences:

- **Confirmed Decision 1 — Exact 2-Column × 1-Row In-Place Spread (No Outer Frame Box)**: When a poster flips open, its grid slot expands strictly from `1 column` to `2 columns` wide while staying `1 row` tall (matching the exact height of neighboring posters on that row), with zero outer container box, padding frame, or background wrapper.
- **Confirmed Decision 2 — Direct Page-Flip Open & Shut (No Button Bar)**: Clicking or swiping a closed poster cover flips it open into its two-page spread; clicking or swiping any non-interactive area of the open booklet pages flips it shut back into a 1-column poster cover. The `Cover | Spread | Fold closed` toolbar and corner `✕` button are completely removed.
- **Confirmed Decision 3 — Multi-Booklet Support & Escape Reset**: Any number of posters can be flipped open at the same time across the grid, and pressing `Escape` flips all open booklets shut at once.

---

## 1. Overview & Core Concept

- **What It Does**: Unifies the closed poster card and the open 3D `PageFlip` spread so every poster on the wall is itself a 2-leaf booklet.
- **Target Audience / Persona**: Aaron and Electra browsing their shared movie wall, peeking inside multiple titles side-by-side, and marking watch status without leaving the poster grid or dealing with modal-like wrapper boxes.
- **Key Value**: Preserves the rhythm and proportions of the poster wall—every open booklet is simply two adjacent poster-sized pages lying open right in the row where the poster sits.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Closed Cover State (`1 col × 1 row`)**: Each movie sits in its normal poster cell (`aspect-ratio: 2 / 3`) displaying its poster artwork, watch-state border glow (`watching` gold, `watched` emerald), and Aaron/Electra watcher badges in the bottom-right corner. Hovering gives a subtle 3D cover-peek angle.
  2. **Flipping Open (`2 cols × 1 row`)**: Clicking (or swiping left on) the poster cover smoothly expands the grid cell to `grid-column: span 2` (same 1-row height) as the cover leaf rotates `180°` around the center spine to reveal the two-page interior spread:
     - **Left Page (Inside Front Cover)**: Compact title, year/runtime/IMDb line, `Aaron` / `Electra` / `Both` watch buttons, and the `Watch on Stremio` / `Edit` action row.
     - **Right Page (Inside Leaf)**: Scrollable plot overview and added/watch attribution footer.
  3. **Flipping Shut**: Clicking (or swiping right on) any non-button surface of the open left or right page flips the cover leaf back to `0°` and returns the slot to `1 col × 1 row`. Pressing `Escape` folds all open booklets closed simultaneously.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Tactile physical media booklet embedded directly in the poster grid with zero modal chrome.
  - *Color Palette & Mood*: Deep obsidian page paper (`#0d111a`), subtle spine shadow, emerald/sky/pink watch-status highlights, and warm gold accents—matching neighboring poster cards.
  - *Typography & Hierarchy*: Ultra-compact booklet typography scaled specifically to fit inside a single poster-sized leaf (`1 row` height) without overflowing or requiring a 2-row box.
  - *Component Styling & Layout*: Frameless `PageFlip` occupying 100% of the grid cell height; in the open state, each leaf is exactly one poster wide (`width / 2`) and one poster tall (`height`).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: True `span 2` Width × `span 1` Height Geometry**
  - *Chosen Approach*: Size `.movie-library-grid__item--booklet-open` to `grid-column: span 2; grid-row: span 1;` so the open two-page spread is the exact width of two posters and the exact height of one poster row.
  - *Why*: Eliminates the oversized `4 col × 2 row` black container box that dwarfed neighboring posters and left dead space around the booklet.
  - *Alternatives Considered*: Spanning 4 columns and 2 rows—rejected because it broke the poster grid's visual scale and looked like an embedded modal rather than the poster itself opening up.
- **Decision 2: Remove Outer Stage Box, Close `✕`, and `Cover | Spread | Fold closed` Bar**
  - *Chosen Approach*: Remove `.movie-inline-booklet__nav` and `.movie-inline-booklet__close`, and let `PageFlip`'s built-in leaf click and swipe gestures turn the cover open (`turnedCount = 1`) and closed (`turnedCount = 0`), syncing directly with `openMovieIds`.
  - *Why*: In the previous design, clicking `Cover` left the single poster stranded inside a huge 4-column black box. Tying the grid slot's open state directly to the cover leaf turn means folding the cover shut immediately restores the normal 1-column poster slot.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:
```
┌───────────────────────────────────────────────────────────────────────────┐
│                         MovieSectionBody (Grid)                           │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ .movie-library-grid__item (1 col × 1 row closed, 2 cols × 1 row open)│  │
│  │   └── MovieInlineBooklet (Frameless 3D PageFlip Booklet)            │  │
│  │         ├── Leaf 0 Front: Poster Cover + Watcher Badges (Closed)    │  │
│  │         ├── Leaf 0 Back : Left Page (Title, Aaron/Electra/Both, CTA)│  │
│  │         └── Leaf 1 Front: Right Page (Plot Overview & Attribution)  │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State**:
  - `openMovieIds: string[]` in `MovieSectionBody` tracks which posters are currently flipped open (`turnedCount = 1`).
  - When a user clicks or swipes an open page in `MovieInlineBooklet`, `PageFlip` fires `onPageChange(0)`, which triggers `onClose()` after the page-turn animation so the item smoothly folds back into its 1-column poster slot.
- **Interactive Component & State Mapping**:
  - **Leaf Surface Click / Swipe**: Clicking or swiping any non-button area on the left or right page of an open booklet turns the cover leaf back to `0°` and closes that booklet in `openMovieIds`.
  - **Interactive Controls Inside Left Page**: Clicking `Aaron`, `Electra`, `Both`, `Watch on Stremio`, or `Edit` is ignored by `PageFlip`'s page-turn handler (`isInteractiveChild`) so watch status and actions trigger without closing the booklet.
  - **Single-Row Booklet Typography Scaling**: `MetadataHeader` and `BookOverview` inside `.movie-inline-booklet` use compact single-row sizing so all controls (`Aaron`, `Electra`, `Both`, and `Watch on Stremio`) fit comfortably within the height of a single grid poster row.
