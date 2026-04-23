

## Make the app feel cohesive, modern, and less "ancient"

Three coordinated fixes: stop the radial menu bubbles from clipping off-screen, give movie suggestions real poster cards that match the watchlist grid exactly, and retire Papyrus everywhere except the "Electron" wordmark.

---

### 1. Radial menu — bubbles never clip off-screen

**Problem:** The toggle docks 96px from the right edge, but when expanded the bubbles fan out 80px further plus button radius — on narrow phones (and even when dragged near any edge on desktop), the green/blue/orange bubbles spill past the viewport.

**Fix in `src/components/effects/RadialMenu.tsx` + `RadialMenu.css`:**
- Compute the menu's true bounding radius (toggle radius + arm length + bubble radius ≈ 120 px desktop / 100 px mobile) and use it everywhere a position is set.
- Update `getDockedPosition()` to inset by that full radius instead of the current 96/110 fudge so the entire fan stays on-screen.
- Tighten `clampToViewport()` to use the same fan radius (currently it only protects the 80×80 toggle), and re-clamp on `resize`, on drag-end, and whenever `isActive` flips on.
- When the menu opens near an edge, mirror the fan inward: pick the quadrant with the most space and apply a CSS class (`menu--fan-tl/tr/bl/br`) that rotates the `<li>` arc origin so bubbles always sweep toward open space rather than off-screen.
- Mobile: shrink the dock margin so the toggle hugs the bottom-right corner without the bubbles clipping (radius now correct).

---

### 2. Suggested movies — real poster cards that match the watchlist grid

**Problem:** `SuggestionCard` currently renders a plain text card via `BaseSuggestionCard`, so it looks nothing like the poster-first movie cards next to it (and on desktop it sits in the same `watchlist-content` grid as movies, so the size mismatch is glaring).

**Fix in `src/components/watchlist/SuggestionCard.tsx`:**
- Rebuild it to mirror `MovieCard`'s structure: `Card` → `MediaCardPosterWrap` → poster image + `MediaCardOverlay` with title/metadata, then a compact action rail with Accept (✓) / Reject (✕) buttons styled like the watchlist's primary/secondary actions.
- Fetch the poster on mount via `fetchOmdbMetadata(suggestion.title)` (same service used elsewhere). Cache miss → `cataas.com` cat fallback → text fallback (matches `MoviePoster` exactly).
- Add a small "Suggested by {name}" eyebrow chip pinned top-left of the poster (similar to the IMDb badge placement) so the suggester is still visible without taking a full row.
- Keep the `suggestion-item-card` class for the existing styles (Y2K silver border, etc.) but the inner DOM becomes poster-shaped, so it inherits the same aspect ratio and grid sizing as `.movie-item-card`.
- `BaseSuggestionCard` stays for `PlaceSuggestionCard` (places don't have posters); only the movie variant gets the poster treatment.
- Remove the now-redundant grid-column-span override (`.watchlist-content > .suggestion-item-card { grid-column: 1 / -1 }`) so suggestions occupy a single grid cell like movies do.
- Drop the mobile horizontal rail (`watchlist-suggestion-rail`) — with poster cards, suggestions can flow into the same 2-column grid as movies on phones, eliminating the separate-component feel.

**Result:** Incoming suggestions and Up Next movies look like one continuous, consistent collection.

---

### 3. Typography — Papyrus only for "Electron"

**Problem:** Papyrus is wired in as the *body, heading, sans, and display* font everywhere — every label, button, dropdown, and input renders in Papyrus, which is the main reason the app feels dated.

**Fix:**
- **`src/theme/tokens.ts`** — change `fontFamily.heading/body/sans` to a modern stack:
  - `heading`: `['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif']`
  - `body`: same
  - `sans`: same
  - Keep `mono` as-is.
  - Add a new `display` entry: `['Papyrus', 'serif']` — used **only** for the brand wordmark.
- **`src/app/App.scss`** — at the `:root` block (~line 2999–3005 and ~10540), replace `--font-body` and `--font-heading` with the Inter stack; keep `--font-display: 'Papyrus', serif` for the brand. Remove the second Papyrus override block at line 10500 ("Papyrus Manuscript Refresh") since the new tokens supersede it.
- **`src/app/AppHeader.css`** — remove every `font-family: var(--font-body, 'Papyrus', serif)` and let elements inherit from the new body stack. Keep `.app-header__brand` on `'Papyrus', serif` so "Electron" stays distinctive.
- Strip the explicit `font-family: 'Papyrus' / fantasy` declarations from:
  - `.movie-poster-cat-title` (App.scss ~line 8115)
  - `.place-item-title` (~9711)
  - `.places-empty-state__title` and other places-section headings (~9946, 10001)
  - `.user-selection--inline .gel-avatar-name--inside` (~1165) — switch to the new heading stack with bold weight for the "ancient label" feel without Papyrus.
  - `.watchlist-top-controls__eyebrow / __title` (~11731+) — use the new heading stack.
- Leave `--font-retro` (used by the deliberate Y2K quiz/retro-ad styling) untouched — that's intentional period styling, not chrome.

**Result:** Interface chrome reads in clean Inter; only the "Electron" brand keeps the Papyrus signature.

---

### Files touched

- `src/components/effects/RadialMenu.tsx` — fan-direction logic, full-radius clamping
- `src/components/effects/RadialMenu.css` — quadrant fan classes, mobile dock spacing
- `src/components/watchlist/SuggestionCard.tsx` — full rebuild as poster card
- `src/components/watchlist/index.tsx` — drop mobile rail branch, use single grid
- `src/theme/tokens.ts` — new font stacks, Papyrus → display only
- `src/app/App.scss` — root font vars, strip Papyrus from non-brand selectors, remove rail/grid-span overrides
- `src/app/AppHeader.css` — strip Papyrus from chrome elements (keep `.app-header__brand`)

