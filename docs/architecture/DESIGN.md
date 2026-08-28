---
name: Electron Design System & Kinetic UI Specification
description: >
  The visual language, design token architecture, and kinetic motion specifications
  for the Electron collaborative date-planning and movie application. Electron blends
  a warm, dark cinema-adjacent palette with nostalgic Y2K retro-future chrome,
  aged copper hardware, and GPU-accelerated 3D kinetic surfaces.
---

# Electron Design System & Kinetic UI Specification

## 1. Color Palette & Token Architecture

The design system is structured around CSS custom properties declared in HSL and hex formats under `apps/web/src/theme/theme.css`. The application supports two dynamic feature palettes (`Movies` and `Places`) nested beneath a unified, warm espresso shell.

```
 ┌─────────────────────────────────────────────────────────────┐
 │                      Shell Canvas                           │
 │                Background: #1d140e (Deep Espresso)          │
 │                                                             │
 │   ┌───────────────────────────┐ ┌─────────────────────────┐ │
 │   │  Movies Theme (Rose/Pink) │ │ Places Theme (Terracotta│ │
 │   │  Accent: #ff7da8          │ │ Accent: #ff8f6b         │ │
 │   │  Secondary: #ffd9a0       │ │ Secondary: #ffd8bf      │ │
 │   └───────────────────────────┘ └─────────────────────────┘ │
 └─────────────────────────────────────────────────────────────┘
```

### 1.1. Unified Shell Palette (Canvas & Framing)

| Token Name | Hex / RGBA Value | Role / Usage |
| :--- | :--- | :--- |
| `--bg-base` | `#1d140e` | Deep espresso root page canvas. |
| `--surface-0` | `#130d08` | Deepest background layer behind transparent WebGL canvasses. |
| `--surface-1` | `rgba(69, 48, 29, 0.78)` | Primary card and panel surface. |
| `--surface-2` | `rgba(90, 63, 39, 0.90)` | Floating controls and elevated toolbars. |
| `--surface-3` | `rgba(113, 81, 52, 0.95)` | High-level dialogs, popovers, and modal panels. |
| `--text-primary` | `#f7efdf` | Warm cream for headings and primary titles (WCAG AAA). |
| `--text-secondary` | `#e0d2b6` | Antique linen for body copy and descriptions. |
| `--text-tertiary` | `#b9a489` | Parchment for captions, metadata, and timestamps. |
| `--accent-primary` | `#c88d59` | Aged copper for primary interactive buttons and active states. |
| `--accent-hover` | `#d9a170` | Warm copper hover highlight. |
| `--border-base` | `rgba(180, 142, 92, 0.40)` | Standard container and card outline border. |
| `--border-inset` | `#7d5f3a` | Inset border styling for retro dialog boxes. |

### 1.2. Movies Feature Palette (`body[data-theme='movies']`)

| Token Name | Hex / RGBA Value | Role / Usage |
| :--- | :--- | :--- |
| `--movies-bg` | `#190f18` | Dark velvet cinema canvas. |
| `--movies-accent` | `#ff7da8` | Neon cinema rose for active filters and highlight badges. |
| `--movies-secondary`| `#ffd9a0` | Warm champagne amber for secondary badges and rating stars. |
| `--movies-tertiary` | `#e1b9c9` | Dusty mauve for tags and subtle borders. |
| `--movies-gradient` | `linear-gradient(140deg, #ff7da8 0%, #ffd9a0 100%)` | Primary button and hero header gradient. |

### 1.3. Places Feature Palette (`body[data-theme='places']`)

| Token Name | Hex / RGBA Value | Role / Usage |
| :--- | :--- | :--- |
| `--places-bg` | `#1f1311` | Warm desert evening canvas. |
| `--places-accent` | `#ff8f6b` | Terracotta orange for map pins and active place filters. |
| `--places-secondary`| `#ffd8bf` | Sandy cream for secondary cards and category pills. |
| `--places-tertiary` | `#f1be95` | Warm ochre for visited place indicators. |
| `--places-gradient` | `linear-gradient(140deg, #ff8f6b 0%, #ffd8bf 100%)` | Action buttons in the Date Spots workspace. |

---

## 2. Typography Hierarchy & Fluid Scaling

Typographic hierarchy utilizes fluid CSS `clamp()` rules to scale smoothly from mobile viewports to 4K displays without layout snapping:

```css
/* Typography Scale Tokens */
--font-display: 'Papyrus', 'Marker Felt', serif;
--font-body: 'Inter', system-ui, -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', 'SFMono-Regular', Consolas, monospace;
```

### Typographic Scale Matrix

| Preset Role | Font Family | Size (Fluid Clamp) | Weight | Letter Spacing | Case |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **Display Wordmark** | Display | `clamp(2.0rem, 1.7rem + 1.5vw, 3.2rem)` | 700 | `-0.04em` | None |
| **H1 Section Header** | Body | `clamp(1.5rem, 1.3rem + 1.0vw, 2.25rem)`| 700 | `-0.02em` | None |
| **Card / Poster Title**| Body | `clamp(0.85rem, 0.75rem + 0.4vw, 1.15rem)`| 800 | `+0.06em` | Uppercase |
| **Tab / Button Label** | Body | `clamp(0.72rem, 0.65rem + 0.3vw, 0.85rem)`| 700 | `+0.05em` | Uppercase |
| **Body Standard** | Body | `clamp(0.875rem, 0.84rem + 0.2vw, 1.0rem)`| 400 | `normal` | None |
| **Micro Caption / Meta**| Body | `0.65rem` (10px) | 500 | `+0.08em` | Uppercase |

---

## 3. Kinetic 3D UI & Spatial Specifications

### 3.1. DriftWall 3D Canvas Stage (`DriftWall.css`)

```css
.drift-wall {
  perspective: 1200px;
  perspective-origin: 50% 50%;
  transform-style: preserve-3d;
}

.drift-wall__plane {
  transform: rotateX(-12deg) rotateY(16deg) rotateZ(2deg);
  transform-style: preserve-3d;
  will-change: transform;
}
```

- **Perspective Distance**: `1200px` (establishes realistic telephoto camera depth without fisheye distortion).
- **Default Stage Tilt**: Pitch: `-12°`, Yaw: `+16°`, Roll: `+2°`.
- **Stereoscopic Hover Lift (`--dw-lift`)**:
  - Unfocused tile: $Z = 0\text{px}$.
  - Focused/Hovered tile: $Z = +64\text{px}$ with dynamic drop shadow (`0 24px 60px -18px rgba(0,0,0,0.7)`).
- **Dual Intersection Mask**:
  ```css
  -webkit-mask-image:
    radial-gradient(ellipse 78% 82% at 50% 46%, #000 70%, transparent 100%),
    linear-gradient(to top, #000 75%, transparent 100%);
  mask-composite: intersect;
  ```

---

## 4. Mathematical CurvedInput Geometry Specification

The `CurvedInput.tsx` component calculates SVG arc vectors dynamically:

```
        ▲ Sagitta (s)
        │
    ╭───┴───╮
   ╱    w    ╲   Chord Width (w)
  ─────────────
       (R) Curvature Radius
```

1. **Radius Derivation**:
   $$R = \frac{s}{2} + \frac{w^2}{8s}$$
2. **Angular Sweep**:
   $$\theta = 2 \times \arcsin\left(\frac{w}{2R}\right)$$
3. **SVG `<path>` Generation**:
   Generates bounding band vectors via:
   $$M(x_0, y_0) \to A(R, R, 0, 0, 1, x_1, y_1) \to L(x_2, y_2) \to A(R - h, R - h, 0, 0, 0, x_3, y_3) \to Z$$
4. **Text Alignment**: Uses `<textPath href="#arc-id" startOffset="50%" text-anchor="middle">` to guarantee centered typography alignment along any curvature intensity.

---

## 5. Motion, Easing & Accessibility Rules

### 5.1. Easing Curves & Durations
- **Modal Entry**: `cubic-bezier(0.16, 1, 0.3, 1)` (Spring-free ease out), duration: `240ms`.
- **Button Micro-Interactions**: `ease-out`, duration: `120ms`.
- **Physics Damping**: Asymptotic exponential decay ($1 - e^{-\Delta t / \tau}$) for pointer tracking.

### 5.2. Motion Safety (`prefers-reduced-motion`)
When the user's operating system requests reduced motion:
- **DriftWall**: Halts automated continuous column translation; allows manual wheel scrolling.
- **WebGL Shader**: Reduces moiré/water ripple velocity to zero.
- **Transitions**: Instantly applies final state with zero duration transitions.
