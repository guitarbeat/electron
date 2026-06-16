---
name: Electron
description: >
  A two-person collaborative date-planning and watchlist application ("Electron")
  built for Aaron and Electra. The interface uses a deep cosmos aesthetic with
  Y2K-inspired retro-future chrome — think late-night cinema under a star field,
  bioluminescent accents, and frosted navy glass. Two switchable colour themes
  (Movies / Places) share a single unified shell and token system in themes.ts.

colors:
  # ── Canonical source ────────────────────────────────────────────────────────
  # All runtime values come from src/theme/themes.ts via applyTheme() on :root.
  # SCSS and components should consume var(--color-*) — avoid duplicating hex.

  # ── Movies theme (body[data-theme='movies']) ────────────────────────────────
  # Deep cosmos: fuchsia-pink × sky-blue on near-black navy.
  movies-background:         "#07091a"
  movies-surface-0:          "#060819"
  movies-surface-1:          "rgba(16, 26, 58, 0.82)"
  movies-surface-2:          "rgba(22, 34, 70, 0.90)"
  movies-surface-3:          "rgba(30, 44, 86, 0.94)"
  movies-accent:             "#f472b6"   # Fuchsia pink — primary interactive
  movies-accent-hover:       "#f9a8d4"
  movies-accent-light:       "#fce7f3"
  movies-secondary:          "#7dd3fc"   # Sky blue — watched / secondary
  movies-tertiary:           "#c4b5fd"   # Soft violet
  movies-quaternary:         "#c4b5fd"
  movies-quinary:            "#7dd3fc"
  movies-text-primary:       "#eef2ff"
  movies-text-secondary:     "#94a3c8"
  movies-text-tertiary:      "#5b6e9a"
  movies-border:             "rgba(148, 163, 200, 0.28)"
  movies-border-subtle:      "rgba(148, 163, 200, 0.12)"
  movies-gradient-primary:   "linear-gradient(128deg, #f472b6 0%, #fb7185 42%, #fce7f3 100%)"

  # ── Places theme (body[data-theme='places']) ────────────────────────────────
  # Bioluminescent reef: teal × violet on deep ocean navy.
  places-background:         "#070f1a"
  places-surface-0:          "#060d18"
  places-surface-1:          "rgba(12, 26, 54, 0.82)"
  places-surface-2:          "rgba(16, 34, 66, 0.90)"
  places-surface-3:          "rgba(22, 44, 80, 0.94)"
  places-accent:             "#2dd4bf"   # Teal — primary interactive
  places-accent-hover:       "#5eead4"
  places-accent-light:       "#ccfbf1"
  places-secondary:          "#a78bfa"   # Violet — secondary
  places-tertiary:           "#67e8f9"   # Cyan highlight
  places-quaternary:         "#67e8f9"
  places-quinary:            "#a78bfa"
  places-text-primary:       "#ecfeff"
  places-text-secondary:     "#82b4c8"
  places-text-tertiary:      "#4a7a8a"
  places-border:             "rgba(103, 232, 249, 0.22)"
  places-border-subtle:      "rgba(103, 232, 249, 0.10)"
  places-gradient-primary:   "linear-gradient(128deg, #2dd4bf 0%, #5eead4 40%, #ccfbf1 100%)"

  # ── Shared status ───────────────────────────────────────────────────────────
  success:                   "#86efac"
  warning:                   "#fde68a"
  error:                     "#fca5a5"
  overlay:                   "rgba(3, 5, 18, 0.88)"

  # ── Shell chrome (theme-tinted, from buildCssVars) ──────────────────────────
  chrome-surface:            "var(--shell-panel-surface)"
  chrome-border-color:       "var(--color-border)"
  chrome-radius-sm:          "0.9rem"
  chrome-radius:             "1.3rem"
  chrome-radius-lg:          "1.85rem"
  shadow-card:               "0 16px 26px rgba(2, 4, 18, 0.24), inset 0 1px 0 color-mix(in srgb, var(--color-text-primary) 6%, transparent)"
  shadow-elevated:           "0 22px 38px rgba(2, 4, 18, 0.38), inset 0 1px 0 color-mix(in srgb, var(--color-text-primary) 9%, transparent)"
  focus-ring:                "color-mix(in srgb, var(--color-accent) 70%, transparent)"

  # ── Moiré background bridge ───────────────────────────────────────────────
  # Written at runtime by the WebGL Moiré effect; defaults match active theme.
  movies-moire-color-1:      "#ff6eb4"
  movies-moire-color-2:      "#7dd3fc"
  movies-moire-accent:       "#f472b6"
  places-moire-color-1:      "#2dd4bf"
  places-moire-color-2:      "#a78bfa"
  places-moire-accent:       "#2dd4bf"

typography:
  families:
    display:  "'Papyrus', 'Marker Felt', serif"          # Brand wordmark, display headings
    body:     "'Inter', 'system-ui', '-apple-system', 'Segoe UI', sans-serif"
    heading:  "'Inter', 'system-ui', '-apple-system', 'Segoe UI', sans-serif"
    mono:     "'JetBrains Mono', 'SFMono-Regular', 'Consolas', monospace"

  scale:
    "3xs":  "0.5625rem"
    "2xs":  "0.625rem"
    xs:     "clamp(0.75rem, 0.7rem + 0.2vw, 0.85rem)"
    sm:     "clamp(0.8125rem, 0.78rem + 0.15vw, 0.9375rem)"
    base:   "clamp(0.875rem, 0.84rem + 0.2vw, 1rem)"
    lg:     "clamp(1rem, 0.95rem + 0.3vw, 1.175rem)"
    xl:     "clamp(1.125rem, 1rem + 0.5vw, 1.375rem)"
    "2xl":  "clamp(1.375rem, 1.2rem + 0.7vw, 1.75rem)"
    "3xl":  "clamp(1.625rem, 1.4rem + 1vw, 2.25rem)"
    "4xl":  "clamp(2rem, 1.7rem + 1.5vw, 3rem)"

  weights:
    normal:    400
    medium:    500
    semibold:  600
    bold:      700
    extrabold: 800

  line-heights:
    none:     1
    heading:  1.2
    snug:     1.25
    tight:    1.3
    normal:   1.55
    relaxed:  1.75

  letter-spacing:
    display:  "-0.04em"
    tight:    "-0.02em"
    normal:   "-0.01em"
    none:     "0"
    wide:     "0.02em"
    dense:    "0.03em"
    button:   "0.04em"
    wider:    "0.05em"
    eyebrow:  "0.08em"
    widest:   "0.14em"

spacing:
  xs:   "0.25rem"
  sm:   "0.5rem"
  md:   "1rem"
  lg:   "1.25rem"
  xl:   "1.75rem"
  "2xl": "2.5rem"
  "3xl": "3.5rem"
  canvas-gap:           "clamp(0.7rem, 0.38rem + 0.8vw, 1.15rem)"
  canvas-padding-block: "clamp(0.3rem, 0.18rem + 0.4vw, 0.7rem)"
  stack-gap:            "clamp(0.85rem, 0.68rem + 0.55vw, 1.3rem)"

radii:
  sm:    "0.375rem"
  md:    "0.625rem"
  lg:    "0.875rem"
  card:  "1rem"
  xl:    "1.25rem"
  chrome-sm: "0.9rem"
  chrome:    "1.3rem"
  chrome-lg: "1.85rem"
  full:  "9999px"

motion:
  duration:
    fast:   "100ms"
    button: "80ms"
    normal: "200ms"
    slow:   "300ms"
    theme:  "280ms"
  easing:
    ease:        "cubic-bezier(0.25, 0.10, 0.25, 1)"
    ease-out:    "cubic-bezier(0, 0, 0.20, 1)"
    spring:      "cubic-bezier(0.34, 1.56, 0.64, 1)"

z-index:
  base:     0
  elevated: 10
  dropdown: 100
  overlay:  900
  modal:    2000
  tooltip:  2100
  loading:  11000

shell:
  max-width: "1480px"
  header-border-radius: "1.4rem"
  panel-border-radius:  "1.25rem"
---

# Electron — Design Language

## Essence

Electron is designed to feel like **a private cinema anteroom shared between two people** — but viewed through a late-90s digital optimism lens. The interface is dark, cool, and luminous: deep navy voids, fuchsia and teal bioluminescence, frosted glass panels, and the slow breathing of a WebGL moiré field behind everything.

Y2K-inspired touches — gel-bubble pill controls, metal-gradient chrome, shimmer sweeps — are restrained enough to stay usable. The goal is nostalgic warmth without costume.

---

## Colour System

### Single source of truth

All palette values live in `src/theme/themes.ts`. `applyTheme()` writes `--color-*`, `--chrome-*`, `--shadow-*`, and moiré bridge variables to `:root` when the user switches Movies or Places. SCSS partials (`app-skin.scss` and its imports) and React inline styles should consume these tokens — not duplicate hex.

### Movies theme — Deep cosmos

Near-black navy canvas (`#07091a`) with **fuchsia pink** accent (`#f472b6`) and **sky blue** secondary (`#7dd3fc`). Surfaces are translucent blue-navy stacks (`surface-0` → `surface-3`). Text runs cool white → slate (`#eef2ff` → `#5b6e9a`).

Per-user card accents in the movie grid: Aaron maps to secondary (sky), Electra to accent (pink). Watched movies shift toward secondary.

### Places theme — Bioluminescent reef

Deep ocean navy (`#070f1a`) with **teal** accent (`#2dd4bf`) and **violet** secondary (`#a78bfa`). Borders pick up a cyan tint. The mood is underwater cartography — cooler and more exploratory than Movies.

### Theme transitions

Colour transitions run `280ms` with `cubic-bezier(0.4, 0, 0.2, 1)`. All `--color-*` custom properties on `:root` update together for a cinematic cross-dissolve.

### Status colours (shared)

- **Success** `#86efac`
- **Warning** `#fde68a` — also used for the gold "watch" action on external movie cards
- **Error** `#fca5a5`

---

## Chroma collection grid

Movie and place grids use a **ChromaGrid-inspired** cursor spotlight (adapted from React Bits):

- **Grid level**: `ChromaCollectionGrid` wraps `CollectionGrid` with grayscale `backdrop-filter` masks (`chroma-overlay` + `chroma-fade`). GSAP (`useChromaSpotlight`) smooths `--x` / `--y` follow-spot position.
- **Card level**: `.chroma-card` adds per-item gradient shells and a radial highlight on `.card-tilt-wrap::after` tracking `--mouse-x` / `--mouse-y`.
- **Photo-mode movies**: Poster grid uses transparent card backgrounds; grid desaturation is softened (`grayscale(0.55)`) so posters stay vivid.
- **Accessibility**: Spotlight disabled on touch devices and when `prefers-reduced-motion: reduce`.

Suggestion cards (`BaseSuggestionCard`) also carry `.chroma-card` for consistent gradient shells.

---

## Typography

| Role | Family | Use |
|---|---|---|
| **Display** | Papyrus, serif | "Electron" wordmark, movies hero eyebrow/title |
| **Body / UI** | Inter, system-ui | All functional copy |
| **Mono** | JetBrains Mono | Code, audit overlay |

Sizes use CSS `clamp()` from `3xs` (9px) through `4xl` (3rem). Eyebrows, button labels, and tab labels are uppercase with tracked letter-spacing.

---

## Surface & glass treatment

Elevated surfaces combine:

1. **Translucent navy fill** from `--color-surface-*` or `--shell-panel-surface`
2. **Backdrop blur** — `blur(22px) saturate(130%)` on header; `blur(20px)` on panels
3. **Top-edge highlight** — `--chrome-highlight-top` inset gradient
4. **Accent-tinted radial glow** — theme accent mixed into panel backgrounds
5. **Token shadows** — `--shadow-card` and `--shadow-elevated`

Skin layers load via `app-skin.scss`: `_retro-accents.scss` → `_workspace-skin.scss` → `_chroma-cards.scss` → `_movies-photo-grid.scss`.

---

## Header

Floating pill header (`border-radius: 1.4rem`), three-column grid collapsing to two rows ≤900px. Frosted glass over the moiré field. Brand wordmark uses Papyrus with accent gradient shimmer. Segmented Movies / Places control uses a sliding frosted pill.

---

## Motion

- **Fast (80–100ms)**: Button press/hover
- **Normal (200ms)**: Colour and border fades
- **Slow (300ms)**: Dropdowns, card expansion
- **Theme (280ms)**: Global palette cross-dissolve
- **Spring**: Slight overshoot for badges and playful controls

`prefers-reduced-motion` collapses durations and disables WebGL moiré animation.

---

## Background — Moiré effect

Full-bleed WebGL moiré (`ogl`) writes `--moire-color-1`, `--moire-color-2`, `--moire-accent` at runtime. Movies defaults: pink `#ff6eb4` × sky `#7dd3fc`. Places defaults: teal `#2dd4bf` × violet `#a78bfa`. Falls back to CSS radial gradients when WebGL is unavailable.

---

## Loading sequence

Split horizontal curtain panels reveal with `scaleY(0)` — cinema curtains parting. Fish tank aquarium renders in document flow at the bottom of the movies shell (not fixed overlay).

---

## Responsive behaviour

- **≤ 900px**: Header stacks; hero stats move below copy
- **≤ 640px**: 44px touch targets; tab labels may hide emoji-only; modals become bottom sheets
- **≤ 380px**: Tighter grid gaps; nav pill height reduced

---

## Accessibility

- Text contrast: primary and secondary text meet WCAG AA on navy surfaces
- Focus rings: `outline` keyed to `--focus-ring` (accent at 70%)
- Reduced motion respected globally
- Minimum 44px touch targets on mobile nav and suggestion actions
