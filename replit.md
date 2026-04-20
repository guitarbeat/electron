# Electron — Collaborative Movie Night & Date-Planning App

A React/TypeScript/Vite SPA for Aaron & Electra to plan movie nights and discover places together.

## Architecture

- **Frontend**: React 18 + TypeScript + Vite (port 5000)
- **Backend**: GitHub Gist (data persistence) + OMDB/TVMaze APIs (movie metadata)
- **State**: React context + localStorage fallback
- **Theme**: Dual-theme system (Movies: pink/blue, Places: peach/mint)
- **Font**: Papyrus everywhere — both `--font-heading` and `--font-body` CSS vars + all `tokens.ts` fontFamily presets unified to `['Papyrus', 'serif']`

## Key Files

| File | Purpose |
|---|---|
| `src/app/App.tsx` | Root component, tab state, theme switching |
| `src/app/App.scss` | All CSS (~12k lines). Movie cards ~line 7977, Place cards ~line 9519 |
| `src/app/AppHeader.css` | Header brand + nav styling |
| `src/components/ui/MediaCard.tsx` | Shared card primitive (PosterWrap, Cover, Overlay, Title, Badge, Actions, Info, Subtext) |
| `src/components/watchlist/MovieCard.tsx` | Movie card component |
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

## Known Non-Issues

- **WebGL context error**: Moire background effect silently skips WebGL in sandboxed preview iframes (handled by try/catch in `Moire.tsx`)
- **404 fetch errors**: OMDB/Gist API calls fail without API keys configured — expected in development without env vars
- **Vite HMR warning** on `PlaceCard.tsx`: Deprecated `getPlaceIcon` export alongside component export prevents fast refresh (pre-existing, full reload instead)
