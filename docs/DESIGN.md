---
name: Electron
description: >
  A two-person collaborative date-planning and watchlist application ("Electron")
  built for Aaron and Electra. The interface uses a warm, dark, cinema-adjacent
  aesthetic with a Y2K-inspired retro-future sensibility — think late-night movie
  parlour, aged copper hardware, and velvet curtains. Two switchable colour themes
  (Movies / Places) live beneath a single unified shell.

colors:
  # ── Default / Shell palette ─────────────────────────────────────────────────
  # The shell is always warm brown-black, regardless of active feature theme.
  background:         "#1d140e"        # Deep espresso — page canvas
  surface:            "rgba(73,51,32,0.72)"
  surface-elevated:   "rgba(92,64,40,0.84)"
  surface-0:          "#130d08"        # Deepest — true background layer
  surface-1:          "rgba(69,48,29,0.78)"   # Card level
  surface-2:          "rgba(90,63,39,0.90)"   # Floating / elevated elements
  surface-3:          "rgba(113,81,52,0.95)"  # Modals & popovers

  text-primary:       "#f7efdf"        # Warm cream — headings, labels
  text-secondary:     "#e0d2b6"        # Antique linen — body copy
  text-tertiary:      "#b9a489"        # Parchment — captions, meta (WCAG AA)

  accent:             "#c88d59"        # Aged copper — primary interactive
  accent-hover:       "#d9a170"
  accent-muted:       "rgba(200,141,89,0.25)"
  accent-light:       "#efd2af"        # Warm gold — gradient highlight end

  secondary:          "#8e9f82"        # Sage green — secondary interactive
  secondary-hover:    "#a3b497"
  secondary-muted:    "rgba(142,159,130,0.25)"

  tertiary:           "#9a6554"        # Fired clay — tertiary accent
  tertiary-hover:     "#af7b68"

  interactive:        "#c88d59"
  interactive-hover:  "#d9a170"

  success:            "#8ca26d"
  warning:            "#d1a15c"
  error:              "#bb705f"

  border:             "rgba(180,142,92,0.40)"
  border-secondary:   "rgba(200,141,89,0.28)"
  border-tertiary:    "rgba(142,159,130,0.24)"
  border-inset:       "#7d5f3a"
  border-subtle:      "rgba(193,154,96,0.18)"

  overlay:            "rgba(18,11,7,0.78)"

  yellow:             "#d4b173"        # Warm gilt — decorative accent
  khaki:              "#e8d3ac"        # Aged paper

  gradient-primary:   "linear-gradient(135deg, #c88d59 0%, #d9a170 100%)"
  gradient-card:      "linear-gradient(180deg, rgba(102,75,49,0.96) 0%, rgba(58,39,24,0.92) 100%)"

  # ── Movies theme ─────────────────────────────────────────────────────────────
  # Applied via body[data-theme='movies']. Rose cinema palette.
  movies-background:       "#190f18"
  movies-surface-0:        "#140b14"
  movies-surface-1:        "rgba(53,27,40,0.72)"
  movies-surface-2:        "rgba(74,38,53,0.88)"
  movies-surface-3:        "rgba(98,54,71,0.93)"
  movies-accent:           "#ff7da8"   # Cinema rose
  movies-accent-hover:     "#ff9bbe"
  movies-accent-light:     "#ffd2df"
  movies-secondary:        "#ffd9a0"   # Warm amber
  movies-tertiary:         "#e1b9c9"   # Dusty mauve
  movies-quaternary:       "#8ef0ff"   # Ice blue
  movies-quinary:          "#c8b3ff"   # Soft lavender
  movies-gradient-primary: "linear-gradient(140deg, #ff7da8 0%, #ffd9a0 100%)"

  # ── Places theme ─────────────────────────────────────────────────────────────
  # Applied via body[data-theme='places']. Terracotta / desert palette.
  places-background:       "#1f1311"
  places-surface-0:        "#160d0c"
  places-surface-1:        "rgba(58,35,30,0.72)"
  places-surface-2:        "rgba(79,49,41,0.88)"
  places-surface-3:        "rgba(108,66,55,0.93)"
  places-accent:           "#ff8f6b"   # Terracotta
  places-accent-hover:     "#ffab8e"
  places-accent-light:     "#ffd8ca"
  places-secondary:        "#ffd8bf"   # Sandy cream
  places-tertiary:         "#f1be95"   # Warm ochre
  places-quaternary:       "#9ff4cf"   # Seafoam
  places-quinary:          "#ffd66e"   # Sunflower
  places-gradient-primary: "linear-gradient(140deg, #ff8f6b 0%, #ffd8bf 100%)"

  # ── Shell chrome ─────────────────────────────────────────────────────────────
  shell-panel-border-strong:  "rgba(255,236,206,0.22)"
  shell-panel-border-soft:    "rgba(255,236,206,0.12)"
  shell-panel-highlight:      "rgba(255,255,255,0.08)"
  shell-panel-glass:          "rgba(255,255,255,0.04)"
  shell-header-surface:       "linear-gradient(155deg, rgba(38,28,20,0.90) 0%, rgba(20,14,11,0.94) 100%)"
  shell-panel-surface:        "linear-gradient(160deg, rgba(46,33,24,0.88) 0%, rgba(22,17,13,0.92) 100%)"

  # ── Moiré background bridge ───────────────────────────────────────────────
  # Written at runtime by the WebGL Moiré effect; defaults match Movies theme.
  moire-color-1:  "#ff6eb4"
  moire-color-2:  "#7dd3fc"
  moire-accent:   "#d39be0"

typography:
  families:
    display:  "'Papyrus', 'Marker Felt', serif"          # Brand wordmark, display headings
    body:     "'Inter', 'system-ui', '-apple-system', 'Segoe UI', sans-serif"
    heading:  "'Inter', 'system-ui', '-apple-system', 'Segoe UI', sans-serif"
    mono:     "'JetBrains Mono', 'SFMono-Regular', 'Consolas', monospace"

  # Fluid clamp()-based scale — values represent the computed range min…max
  scale:
    "3xs":  "0.5625rem"    # 9px — micro labels
    "2xs":  "0.625rem"     # 10px — captions
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

  # Named presets (role → computed values)
  presets:
    eyebrow:
      family:          body
      size:            "0.72rem"
      weight:          semibold
      line-height:     none
      letter-spacing:  eyebrow
      transform:       uppercase
    button-label:
      family:          heading
      weight:          semibold
      line-height:     none
      letter-spacing:  button
      transform:       uppercase
    badge:
      family:          heading
      size:            "0.70rem"
      weight:          extrabold
      line-height:     none
      letter-spacing:  wider
      transform:       uppercase
    tab-label:
      family:          heading
      size:            "clamp(0.72rem, 1vw + 0.45rem, 0.85rem)"
      weight:          bold
      line-height:     none
      letter-spacing:  wider
      transform:       uppercase
    poster-title:
      family:          heading
      size:            "clamp(0.85rem, 2.5vw, 1.15rem)"
      weight:          extrabold
      line-height:     heading
      letter-spacing:  "0.06em"
      transform:       uppercase
    title-sm:
      family:          heading
      size:            "1.25rem"
      weight:          semibold
      line-height:     heading
      letter-spacing:  normal
    title-md:
      family:          heading
      size:            "1.5rem"
      weight:          semibold
      line-height:     heading
      letter-spacing:  tight
    body-sm:
      family:          body
      size:            sm
      line-height:     normal
    caption:
      family:          body
      size:            "2xs"
      line-height:     tight
    micro:
      family:          body
      size:            "3xs"
      line-height:     tight

spacing:
  xs:   "0.25rem"   # 4px
  sm:   "0.5rem"    # 8px
  md:   "1rem"      # 16px
  lg:   "1.25rem"   # 20px
  xl:   "1.75rem"   # 28px
  "2xl": "2.5rem"   # 40px
  "3xl": "3.5rem"   # 56px

  # Fluid shell spacing (clamp-based)
  canvas-gap:          "clamp(0.7rem, 0.38rem + 0.8vw, 1.15rem)"
  canvas-padding-block: "clamp(0.3rem, 0.18rem + 0.4vw, 0.7rem)"
  stack-gap:           "clamp(0.85rem, 0.68rem + 0.55vw, 1.3rem)"
  stack-padding-top:   "clamp(0.55rem, 0.42rem + 0.55vw, 0.95rem)"
  stack-padding-bottom: "clamp(0.8rem, 0.6rem + 0.8vw, 1.35rem)"

radii:
  none:  "0"
  sm:    "0.375rem"   # 6px — badges, small chips
  md:    "0.625rem"   # 10px — menu items, form fields
  lg:    "0.875rem"   # 14px — dropdowns, modals
  card:  "1rem"       # 16px — content cards
  xl:    "1.25rem"    # 20px — panels, sheet overlays
  full:  "9999px"     # pill / avatar

shadows:
  # Cards
  card:         "0 1px 3px rgba(0,0,0,0.30), 0 1px 2px rgba(0,0,0,0.20)"
  card-hover:   "0 10px 30px rgba(0,0,0,0.40), 0 0 15px rgba(255,127,198,0.15), inset 0 1px 0 rgba(255,255,255,0.06)"
  card-elevated: "0 4px 16px rgba(0,0,0,0.35), 0 2px 6px rgba(0,0,0,0.20)"

  # Buttons (subtle 3D lift)
  button:        "0 2px 4px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.10)"
  button-hover:  "0 4px 8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.12)"
  button-active: "0 1px 2px rgba(0,0,0,0.30), inset 0 2px 4px rgba(0,0,0,0.15)"
  button-large:  "0 4px 12px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.10)"

  # Glow (theme-tinted halos)
  glow:       "0 0 15px rgba(255,127,198,0.40), 0 0 30px rgba(255,127,198,0.15)"
  glow-strong: "0 0 20px rgba(255,127,198,0.60), 0 0 40px rgba(255,127,198,0.25)"
  glow-blue:  "0 0 15px rgba(149,220,255,0.50), 0 0 30px rgba(149,220,255,0.20)"
  glow-yellow: "0 0 15px rgba(255,240,106,0.50), 0 0 30px rgba(255,240,106,0.20)"

  # Panels
  panel:      "0 24px 56px rgba(0,0,0,0.24)"
  panel-soft: "0 14px 28px rgba(0,0,0,0.16)"
  floating:   "0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.25)"

  # Text
  text-glow:        "0 1px 2px rgba(0,0,0,0.50), 0 0 8px rgba(255,127,198,0.35)"
  text-glow-blue:   "0 1px 2px rgba(0,0,0,0.50), 0 0 8px rgba(149,220,255,0.35)"
  text-glow-yellow: "0 1px 2px rgba(0,0,0,0.50), 0 0 8px rgba(255,240,106,0.35)"
  text-outline:     "0 0 1px rgba(0,0,0,0.60), 0 0 2px rgba(0,0,0,0.40)"

motion:
  duration:
    fast:   "100ms"
    button: "80ms"
    normal: "200ms"
    slow:   "300ms"
    theme:  "280ms"   # Cross-theme colour transition

  # Prefers-reduced-motion overrides all above to "0.01ms"

  easing:
    ease:       "cubic-bezier(0.25, 0.10, 0.25, 1)"
    ease-in:    "cubic-bezier(0.40, 0, 1, 1)"
    ease-out:   "cubic-bezier(0, 0, 0.20, 1)"
    ease-in-out: "cubic-bezier(0.40, 0, 0.20, 1)"
    spring:     "cubic-bezier(0.34, 1.56, 0.64, 1)"  # slight overshoot
    linear:     "linear"

elevation:
  # Conceptual elevation tiers, not pixel values
  base:     0   # Page background (surface-0)
  card:     1   # Resting content card (surface-1)
  floating: 2   # Elevated elements, popovers (surface-2)
  modal:    3   # Full overlays, modals (surface-3)

z-index:
  base:     0
  elevated: 10
  dropdown: 100
  overlay:  900
  modal:    2000
  tooltip:  2100
  loading:  11000

effects:
  backdrop-filter-header:  "blur(22px) saturate(130%)"
  backdrop-filter-panel:   "blur(20px)"
  backdrop-filter-control: "blur(8px)"
  glass-highlight:         "rgba(255,255,255,0.18)"

shell:
  max-width: "1480px"
  header-border-radius: "1.4rem"   # 22.4px — floating pill shape
  panel-border-radius:  "1.25rem"
---

# Electron — Design Language

## Essence

Electron is designed to feel like **a private cinema anteroom shared between two people**. The interface is dark, warm, and intimate — not sterile tech-dark, but something closer to burnished leather, candlelight on copper, and the glow of a projector warming a curtained room.

The Y2K-inspired touches — animated interference-pattern backgrounds, gel-bubble pill controls, shimmer sweeps across chrome surfaces — evoke a nostalgic era of romantic digital optimism, filtered through a contemporary restraint that keeps the experience usable rather than costume-y.

---

## Colour System

### Permanent Shell — Warm Brown-Black

The application chrome never changes colour between themes. It uses a persistent **espresso-and-aged-copper** palette:

- **Background `#1d140e`**: The true page canvas. Deep, almost-black brown — like the inside of an old wooden film cabinet.
- **Surface layers `surface-0` → `surface-3`**: A four-step elevation stack using translucent warm browns. Each layer adds opacity and raises the lightness slightly, creating depth without harsh contrast. Glass-morphism (`backdrop-filter: blur`) is applied to headers and panels, letting the animated background bleed through softly.
- **Accent `#c88d59` (aged copper)**: The single interactive hue shared across all shell chrome. Used for borders, highlights, focus rings, and the brand wordmark gradient.
- **Text hierarchy**: Warm cream `#f7efdf` → antique linen `#e0d2b6` → parchment `#b9a489`. All three meet WCAG AA contrast on their respective surfaces.

### Movies Theme — Rose Cinema

When a user switches to the Movies mode, the accent family shifts to **cinema rose** (`#ff7da8`) paired with **warm amber** (`#ffd9a0`). The background deepens to a near-black plum `#190f18`. The body background image becomes a dramatic constellation of radial crimson gradients with tiny star-point highlights — like looking up at a velvet screen ceiling.

### Places Theme — Terracotta Desert

The Places mode uses **fired terracotta** (`#ff8f6b`) and **sandy cream** (`#ffd8bf`). The background shifts to a warm sienna `#1f1311` with simulated sunlight — a bright radial flare at the upper-right suggesting outdoor light. This theme is airier and earthier than Movies, conveying maps, neighbourhoods, and daytime adventure.

### Theme Transitions

Colour transitions are handled in `280ms` using `cubic-bezier(0.4, 0, 0.2, 1)`. All `--color-*` custom properties on `body[data-theme]` animate together, giving a smooth cinematic cross-dissolve feel between modes.

---

## Typography

### Typefaces

| Role | Family | Rationale |
|---|---|---|
| **Display / Brand** | Papyrus, serif | Deliberately ornate and hand-worn. Used exclusively for the "Electron" wordmark and display headings — its imperfection signals handmade warmth over corporate polish. |
| **Interface / Body** | Inter, system-ui | Neutral, highly legible, fluid at every size. Carries all functional copy. |
| **Monospace** | JetBrains Mono | Reserved for code snippets and technical data within the audit overlay. |

### Scale & Fluid Sizing

All sizes use CSS `clamp()` to scale smoothly from mobile to wide-screen. The scale runs from `3xs` (9 px, micro-labels) through `4xl` (up to 3 rem, display headings). There is no hard-coded breakpoint jump — sizes glide continuously.

### Type Roles

- **Eyebrow**: 0.72 rem, SEMIBOLD, 0.08 em tracking, ALL-CAPS. Used for section labels and overlines above headings.
- **Button Label**: Inter SEMIBOLD, 0.04 em tracking, ALL-CAPS. Consistent across all interactive controls.
- **Badge**: 0.70 rem, EXTRABOLD, 0.05 em tracking, ALL-CAPS. High-density labels on chips and status pills.
- **Tab Label**: Fluid 0.72–0.85 rem, BOLD, 0.05 em tracking, ALL-CAPS. Navigation tabs in the header.
- **Poster Title**: Fluid 0.85–1.15 rem, EXTRABOLD, 0.06 em tracking, ALL-CAPS. Movie card titles in the watchlist grid.
- **Body**: Inter NORMAL, line-height 1.55. Relaxed and legible for longer descriptive text.
- **Caption / Micro**: 10–9 px, tight line-height. Timestamps, metadata, supplementary detail.

---

## Surface & Glass Treatment

Every elevated surface uses a combination of:

1. **Translucent warm-brown fill** — e.g., `rgba(69, 48, 29, 0.78)`.
2. **Backdrop blur** — `blur(22px) saturate(130%)` on the header; `blur(20px)` on panels and menus.
3. **Top-edge highlight** — a thin `rgba(255,255,255,0.08)` inset shadow and a `linear-gradient` from `rgba(255,255,255,0.08)` to transparent over the first 28% of the surface. This simulates a soft rim-light catching the top of a physical object.
4. **Accent-tinted radial glow** — a `radial-gradient` centred at the top of the surface, mixing the current `--color-accent` into the background at 16% opacity. This gently "warms" the bottom face of panels to match the theme colour.
5. **Outer shadow** — `0 24px 56px rgba(0,0,0,0.24)` for resting panels; deepened on hover.

This creates the illusion of a polished but slightly worn material — somewhere between anodised metal and old lacquered wood.

---

## Header

The floating header is the signature chrome element. It:

- Has a **pill shape** with `border-radius: 1.4rem`, giving it a friendly, floating-bar look.
- Sits in a **three-column grid** (`left | center | right`) that collapses to two rows on narrow viewports.
- Carries a **light sweep animation** (`@keyframes shell-light-sweep`) — a translucent diagonal stripe that slides across the header surface, like light catching a curved chrome surface.
- Uses `backdrop-filter: blur(22px) saturate(130%)` for a frosted-glass look over the animated background.
- Has an accent-tinted border: `color-mix(in srgb, var(--color-accent) 18%, shell-border)`.

The **brand wordmark** "Electron" uses Papyrus with a three-stop shimmer gradient: `accent-light → accent → accent-light → text-primary`. This gives it the look of engraved metal catching a light source from the left.

---

## Controls

### Segmented Pill (Theme / Mode Toggle)

The Movies / Places switcher is a **segmented control** inside a pill container. It uses:

- Outer track: `rgba(255,255,255,0.07)` with an inset shadow and `backdrop-filter: blur(8px)`.
- Active **sliding pill**: `rgba(255,255,255,0.15)` with `inset 0 1px 0 rgba(255,255,255,0.25)` — a frosted glass tab. The pill is absolutely positioned and animates via `left` + `width` transitions, not class-swap, producing a smooth physical slide.
- Inactive labels: `rgba(255,255,255,0.45)`. Active labels: `rgba(255,255,255,0.95)` at weight 600.
- Compact variant reduces padding and font size for use inside the narrow header on mobile.

### Buttons

Buttons use a three-state shadow system (`button` → `button-hover` → `button-active`) that mimics a subtle physical press: lifting on hover (`translateY(-1px)`) and depressing on active. The hover state brightens the inset highlight to `rgba(255,255,255,0.12)`, simulating light reflecting off a raised surface.

### Focus Rings

All focusable elements use `outline: 2px solid var(--color-accent); outline-offset: 2px`. The accent colour is always theme-matched, ensuring focus rings feel integrated rather than bolted on.

---

## Motion

The motion system is deliberately conservative and purposeful:

- **Fast (`80–100ms`)**: Button micro-interactions — press, hover lift, active depress. These must feel immediate.
- **Normal (`200ms`)**: General UI transitions — hover state colour changes, border fades.
- **Slow (`300ms`)**: Entrance/exit animations — dropdown menus appearing, cards expanding.
- **Theme (`280ms`)**: The global theme cross-dissolve. Fast enough not to feel sluggish, slow enough that users notice the colour shifting.
- **Spring `cubic-bezier(0.34, 1.56, 0.64, 1)`**: Used for elements that should overshoot slightly — interactive badges, dial animations — to make them feel alive.

Menus use `opacity` + `transform: translateY(-4px) scale(0.98)` entrance to feel like they're materialising from just above their trigger. On mobile they slide up from the bottom edge.

`@media (prefers-reduced-motion: reduce)` collapses all durations to `0.01ms` and disables WebGL background animations.

---

## Background — Moiré Effect

The most distinctive visual element is the full-bleed **WebGL Moiré background** rendered by `ogl`. It produces animated interference-pattern ripples that slowly shift and breathe behind the frosted UI layer. It writes three CSS custom properties at runtime:

- `--moire-color-1`, `--moire-color-2`, `--moire-accent`

These colours match the active theme's accent palette, creating a live colour bridge between the shader and the UI chrome. The Moiré layer sits at the very bottom of the stacking context, and everything above it is translucent enough to let the animation show through.

When WebGL is unavailable, the background degrades to the `body[data-theme]` CSS `background-image` — a richly layered set of radial gradients that approximate the depth and warmth of the animated version.

---

## Loading Sequence

On first load, a pair of opaque curtain panels (`--loading-mask-color: #e8e0d4`) cover the screen split horizontally at the midpoint. They reveal with a `scaleY(0)` transform — like cinema curtains parting — at `1s ease-in-out`. The curtain blends with content below using `mix-blend-mode: difference`, so the reveal feels theatrical rather than a simple fade.

---

## Icon & Illustration Language

Icons throughout the app are emoji-first — actual Unicode emoji characters rather than SVG icons — giving the UI a playful, personal quality appropriate for a private two-person app. Feature modes are identified by emoji: 🎬 for Movies, 📍 for Places.

The brand mark ("Electron" in Papyrus) is the sole illustration-weight element. It carries the shimmer gradient and tracks at a slightly wider spacing (`0.03em`) than body text to emphasise its display role.

---

## Responsive Behaviour

- **≤ 900 px**: Header switches from three-column horizontal to two-row stacked: brand name in the top row spanning both columns; nav controls (left) and profile (right) in the bottom row.
- **≤ 640 px**: Pill tabs lose text labels, showing emoji only. Header border-radius reduces from `1.4rem` to `1.15rem`.
- **≤ 600 px**: Header becomes `position: sticky` at the top safe area. Profile menu slides up from the bottom edge as a sheet (`border-radius: 1rem 1rem 0 0`).
- **≤ 380 px**: Further tightening of padding and font sizes. Avatar borders narrow to `1.5px`.

---

## Accessibility

- Text contrast ratios: `text-primary` on `surface-1` exceeds WCAG AA; `text-tertiary` on `surface-1` is calibrated to just meet WCAG AA.
- All interactive elements carry visible focus rings keyed to the current `--color-accent`.
- `prefers-reduced-motion` is respected globally — all transitions and the WebGL background are effectively instant or static.
- Minimum touch targets are enforced: `44 px` height for nav tabs on mobile, `40 px` for chips and action buttons.
