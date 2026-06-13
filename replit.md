# Electron — Collaborative Movie Night & Date-Planning App

A React/TypeScript/Vite SPA for Aaron & Electra to plan movie nights and discover places together.

## Architecture

- **Frontend**: React 18 + TypeScript + Vite (port 5000)
- **Backend**: Neon Postgres (shared state) + OMDB/TVMaze APIs (movie metadata)
- **State**: React context + localStorage fallback
- **Theme**: Dual-theme system (Movies: pink/blue, Places: peach/mint)
- **Font**: Papyrus everywhere — both `--font-heading` and `--font-body` CSS vars + all `tokens.ts` fontFamily presets unified to `['Papyrus', 'serif']`

## Key Files

| File | Purpose |
|---|---|
| `src/app/App.tsx` | Root component, tab state, theme switching |
| `src/app/App.scss` | All CSS (~13k lines). Movie cards ~line 8070, Place cards ~line 9508 |
| `src/app/overrides.css` | Unified polish layer (replaces refinements.css + minimal.css). Scrollbars, card hover, animations, header, shell surfaces, modals — imported after App.scss |
| `src/app/AppHeader.css` | Header brand + nav styling |
| `src/components/ui/MediaCard.tsx` | Shared card primitive (PosterWrap, Cover, Overlay, Title, Badge, Actions, Info, Subtext) |
| `src/components/movies/MovieCard.tsx` | Movie card component |
| `src/components/places/PlaceCard.tsx` | Place card component |
| `src/theme/tokens.ts` | Design tokens (colors, spacing, typography, motion) |

## Design System

- `--font-heading`: `'Papyrus', serif` — used for all display text, titles, buttons, badges
- `--font-body`: `'Papyrus', serif` — body text (yes, both are Papyrus for the Y2K/fantasy aesthetic)
- `--color-accent`: Theme-aware (pink in Movies, peach in Places)
- Both card types share a `2:3` aspect-ratio poster format
- Both card types use an identical bottom gradient overlay design

## Layout & Section Headings

Both tabs share the `.workspace-section-heading` CSS class for section dividers:
- Papyrus uppercase, smaller eyebrow size (`clamp(0.78rem…0.96rem)`)
- Amber ink color for primary sections (`--incoming`: slightly warmer, default `--color-accent`)
- Green tint for completed sections (`--completed` modifier, used by "Watched" and "Visited")
- A trailing decorative line via `::after` that fades to transparent
- Y2K skin overrides the color to sepia-amber (#8a5c1e) and green for completed sections

Movies watchlist now has three named sections with headings: **Incoming** (suggestions), **Up Next** (queue), **Watched**.
Places tab has: **suggestions pending** count, **To Try**, **Visited** — using `.places-section-heading` which is an alias for `.workspace-section-heading`.

### PlacesTopControls

Search bar for Places now mirrors the Movies bar exactly:
- Same `.watchlist-top-controls__search-form / __search-shell / __search-field` classes
- 📍 icon instead of 🎬
- Add + Suggest buttons appear when query is non-empty
- Rendered above the map in `PlacesList`; map no longer contains a floating search overlay
- Converted to `React.forwardRef` exposing `PlacesTopControlsHandle { focusSearchInput() }` so parent can focus the input programmatically
- Escape key clears search; clear (✕) button shown when query is non-empty
- ARIA combobox/listbox attributes applied when autocomplete suggestions visible

## Usability / Accessibility Improvements

- **`"/"` keyboard shortcut**: Both `MoviesView` and `PlacesList` add a global `keydown` listener; pressing `/` outside any input focuses the search field immediately.
- **Autocomplete arrow-key navigation**: `MoviesTopControls` now handles `ArrowDown`, `ArrowUp`, `Escape`, and `Enter` in the autocomplete dropdown via `getNextMovieAutocompleteIndex` (was implemented but never wired up).
- **Places loading skeleton**: `PlacesList` renders 4 `MovieCardSkeleton` cards + a "Loading your places" message while `isLoading && allPlaces.length === 0`.
- **Suspense fallback**: `AppWorkspaceShell` replaces `fallback={null}` with a `PlacesTabFallback` component (🗺️ icon + "Loading places…") with `role="status"` and `aria-live="polite"`.
- **`aria-label` on workspace section**: `<section>` in `AppWorkspaceShell` now carries a descriptive `aria-label` ("Movies workspace" / "Places workspace").

## Card Parity (Movies ↔ Places)

Both card types are styled to be visually identical:
- Same `2:3` poster aspect ratio
- Same spring hover animation (`cubic-bezier(0.34, 1.56, 0.64, 1)`)
- Same bottom overlay gradient (`rgba(3,6,12,0.97) → transparent`)
- Same title treatment: Papyrus, uppercase, `0.04em` letter-spacing, color transition on hover
- Same top accent stripe: Movies use per-user color (Aaron=blue, Electra=pink); Places use per-category color
- Same top-left badge: Movies use IMDB star rating; Places use category emoji + label
- Same genre chip: amber-tinted Y2K chip (warm amber bg, #f5d898 text) — Movies use genre text; Places use category label
- Same action buttons: glass pill style with `backdrop-filter: blur(10px)`

## Y2K Skin Cohesion (Watchlist / App-wide)

The Y2K skin section (App.scss ~line 11736) applies these unified rules:
- **Suggestion cards**: Y2K raised-bevel amber panel (`var(--y2k-silver)` bg, Y2K bevel borders) — matching the Win98 search bar style
- **Movie cards**: Y2K outset raised frame (3px bevel borders)
- **All fonts**: `'Papyrus', serif` everywhere — eyebrow labels, section titles, search field, autocomplete, buttons, movie titles, meta, genre badges, IMDb scores
- **Card hover highlight**: warm amber (`rgba(196, 154, 80, 0.75)`) instead of cold blue
- **Genre badges / IMDb badge**: warm amber background, no more cold blue
- **Spin wheel summary items**: warm amber borders and background
- **Tokens.ts alignment**: `fontFamily.body` set to `['Papyrus', 'serif']` to match the CSS variable `--font-body`, so inline-styled React components and CSS-class-based styles are in sync

## PWA / Installable

Electron is installable as a Progressive Web App on phones and desktops:
- `public/manifest.json` — name, theme + background color (`#1d140e` dark wood), standalone display, portrait orientation, icons (32px, 180px Apple touch, 512px maskable)
- `public/sw.js` — minimal service worker: network-first for navigations (so updates roll out promptly), cache-first for static shell assets, never caches `/api/*`
- `index.html` — links the manifest, sets `theme-color`, `apple-mobile-web-app-title`, `application-name`
- `src/main.tsx` — registers `/sw.js` only in production (so dev HMR isn't intercepted)
- iOS safe-area handling is already in place across `App.scss` via `env(safe-area-inset-*)` so the app respects the notch when added to homescreen

## Mobile Polish (App.scss, end of file)

A focused "Mobile-friendly polish" block at the bottom of `App.scss` covers:
- **Y2K ticker** (`.y2k-ticker`) — was rendering as plain wrapping text on three lines. Now: single-line scrolling marquee, edge-faded via mask-image, ~80s loop, sepia-amber Papyrus, respects `prefers-reduced-motion`.
- **44px touch targets** — at `max-width: 640px`, suggestion accept/reject buttons (`.suggestion-item-card__button`) bump from 36×36 to 44×44 with 20px icons (Apple HIG minimum for touch).
- **No iOS auto-zoom** — inputs/textareas/selects forced to `font-size: max(16px, 1rem)` on phones so Safari doesn't zoom in when focusing a field.
- **Header tap targets** — at `max-width: 640px`, the Movies/Places segmented tabs (`.seg-control--compact .seg-control__btn`), profile trigger, and background toggle all bump to a 44px minimum height/width.
- **Suggestion buttons fill the row** — on phones the accept/reject pair grows to share the available width (capped at 220px each) instead of clustering tightly in the bottom-left.
- **Modals dock to the bottom edge** — on phones, modals/sheets become full-width, anchor to the bottom with rounded top corners, and respect the home-indicator safe area.
- **iOS momentum scrolling** — `-webkit-overflow-scrolling: touch` on the app shell + modal containers.

## State Sync Architecture

- **`stateClient.ts`** — module-level outbox (`Map<StateScope, Outbox>`) + `degradedReadScopes` (`Set<StateScope>`)
- **`flushPendingSync`** — runs on online/focus/45s interval; retries both scopes with queued mutations AND scopes that had network read failures, so the sync banner clears promptly without waiting for the hook's next poll
- **`readScope`** — on success removes scope from `degradedReadScopes`; on network catch adds it
- **`retryScopeSync`** — public retry used by hook `retrySync` buttons; replays outbox then re-reads
- **`useCollection`** polls every 15s as the long-stop recovery path

## Notable UI

- **Spin button** — promoted to `AppHeader` right side (movies tab only) via `onOpenSpin` prop + `.app-header__spin-trigger` CSS; backed by `showSpinMatch` state in `App.tsx`
- **WebGL guard** — `webGLAvailable` module-level IIFE const in `App.tsx` gates `ThemedMoire`; avoids blank screens when WebGL is unavailable in sandboxed iframes

## Known Non-Issues

- **WebGL context error**: Moire background effect silently skips WebGL in sandboxed preview iframes — guarded by `webGLAvailable` const at module load in `App.tsx`
- **404 fetch errors**: OMDB/database API calls fail without API keys configured — expected in development without env vars
- **Vite HMR warning** on `PlaceCard.tsx`: Deprecated `getPlaceIcon` export alongside component export prevents fast refresh (pre-existing, full reload instead)
- **TS error at App.tsx:29**: Pre-existing lazy import type mismatch (fallback `FC<{}>` vs typed props) — does not affect runtime
