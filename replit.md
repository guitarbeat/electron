# Electron — Collaborative Movie Night & Date-Planning App

A React/TypeScript/Vite SPA for Aaron & Electra to plan movie nights and discover places together.

## Architecture

- **Frontend**: React 18 + TypeScript + Vite (port 5000)
- **Backend**: GitHub Gist (data persistence) + OMDB/TVMaze APIs (movie metadata)
- **State**: React context + localStorage fallback
- **Theme**: Dual-theme system (Movies: pink/blue, Places: peach/mint)
- **Font**: Papyrus (headings/brand), Cormorant Garamond (body), system-ui (Y2K skin only)

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

## Card Parity (Movies ↔ Places)

Both card types are styled to be visually identical:
- Same `2:3` poster aspect ratio
- Same spring hover animation (`cubic-bezier(0.34, 1.56, 0.64, 1)`)
- Same bottom overlay gradient (`rgba(3,6,12,0.97) → transparent`)
- Same title treatment: Papyrus, uppercase, `0.04em` letter-spacing, color transition on hover
- Same top accent stripe: Movies use per-user color (Aaron=blue, Electra=pink); Places use per-category color
- Same top-left badge: Movies use IMDB star rating; Places use category emoji + label
- Same genre chip: Movies use genre text; Places use category label
- Same action buttons: glass pill style with `backdrop-filter: blur(10px)`

## Known Non-Issues

- **WebGL context error**: Moire background effect silently skips WebGL in sandboxed preview iframes (handled by try/catch in `Moire.tsx`)
- **404 fetch errors**: OMDB/Gist API calls fail without API keys configured — expected in development without env vars
- **Vite HMR warning** on `PlaceCard.tsx`: Deprecated `getPlaceIcon` export alongside component export prevents fast refresh (pre-existing, full reload instead)
