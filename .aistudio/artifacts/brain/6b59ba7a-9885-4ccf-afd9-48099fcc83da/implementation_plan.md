# High-Contrast Frosted Dynamic Notches

Resolves low legibility and visual clutter on the corner and top-center dynamic notches (`Search`, `Pick a movie / Messages`, `Add`, `Settings`, and `Profiles`) where underlying poster badges and high-frequency artwork bleed through the mid-grey `mix-blend-mode: difference` surface and clash with dark foreground labels.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following design decisions incorporate your confirmed preferences from the clarification step:

- **Confirmed Decision 1 — Frosted Blur Backing with High-Contrast Surface**: Each notch's non-blended host layer will apply a frosted `backdrop-filter: blur(...)` and high-contrast surface backing so busy movie poster details (titles, watch-status rings, and high-contrast edges) are smoothly diffused beneath the notch.
- **Confirmed Decision 2 — Difference Blend Preserved with Readable Text Treatment**: The viewport frame and `.dyn-notch--frame` elements keep `mix-blend-mode: difference` with a brighter, higher-contrast surface value, while foreground labels and icons (`Search`, `Pick a movie`, `Messages`, `Add`, `Settings`, profile names, and expanded notch controls) receive a crisp contrast treatment and luminous halo so text stays effortlessly readable over any poster luminance.

---

## 1. Overview & Core Concept

- **What It Does**: Eliminates the muddy mid-tone clash where `#999999` difference-blended notches over mid-luminance posters produce low-contrast backgrounds with sharp poster details showing directly behind dark `#15140f` text.
- **Target Audience / Persona**: Viewers browsing and filtering the media wall across desktop, mobile, and TV runtimes.
- **Key Value**: Preserves the signature adaptive `mix-blend-mode: difference` frame aesthetic while ensuring WCAG AA+ legibility for every notch trigger label, chevron, and expanded panel control.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Collapsed Corner & Center Notches**: As movie posters scroll or drift beneath `Search`, `Pick a movie / Messages`, `Add`, `Settings`, and `Profiles`, the frosted backing layer blurs the underlying poster area so watch-status badges and poster typography no longer compete with the notch icons and labels.
  2. **Hover & Peek States**: When a notch peeks or expands on hover/focus, the frosted backing layer scales in lockstep with the difference-blended frame notch.
  3. **Expanded Panels**: Opening `Search`, `Add`, `Settings`, `Pick a movie`, `Messages`, or `Profiles` maintains a clean, frosted, high-contrast reading surface for all interactive controls.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Tactile frosted glass layered with difference-blended architectural framing.
  - *Color Palette & Mood*:
    - Brighter frame/notch difference token (`--frame-color: #c8c8c8` / high-luminance neutral) paired with a frosted translucent backing on the host notch so the resulting composite surface stays bright and uniform enough for dark ink (`--notch-ink: #0f1117`).
    - Foreground labels (`--notch-ink`) reinforced with a subtle luminous text halo (`text-shadow`) so dark typography remains crisp even over bright poster highlights.
  - *Typography & Hierarchy*: Bold `750–800` weight single-line trigger labels (`0.68rem`) with balanced tracking and high-contrast chevron/icon strokes.
- **Interactive Feedback & Motion**: The frosted host twin shares the exact `--dyn-w`, `--dyn-h`, `--notch-radius`, and spring transition (`--notch-open` / `--notch-close`) of the frame notch so both layers morph as a single cohesive unit.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Dual-Layer Notch Compositing (Difference Frame + Frosted Host Twin)**
  - *Chosen Approach*: Use the existing `.dyn-notch:not(.dyn-notch--frame)` twin element (which already tracks the exact dimensions, position, and spring physics of each notch) to provide `backdrop-filter: blur(16px) saturate(1.35)` and a subtle light-stabilizing tint, while `.dyn-notch--frame` inside `.viewport-frame` continues running `mix-blend-mode: difference`.
  - *Why*: CSS does not allow a single element with `mix-blend-mode: difference` inside an isolated blending parent to simultaneously blur the backdrop and maintain a predictable luminance floor. Leveraging the existing host twin achieves both frosted diffusion and difference blending with zero extra DOM nodes.
  - *Alternatives Considered*: Pure `mix-blend-mode: difference` without backdrop blur was rejected because sharp poster text and avatar badges remain visible directly behind the notch labels.
- **Decision 2: Foreground Label Halo & Contrast Floor**
  - *Chosen Approach*: Add a subtle luminous halo (`text-shadow: 0 1px 0 rgba(255, 255, 255, 0.55), 0 0 8px rgba(255, 255, 255, 0.35)`) and stronger ink weight to notch labels, chevrons, and artwork drop-shadows.
  - *Why*: Guarantees immediate readability regardless of whether the poster underneath is pitch black, mid-grey, or bright yellow/blue.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Layering Diagram**:

```
┌──────────────────────────────────────────────────────────────────────┐
│ Z-Layer 1100: Foreground Controls & Labels (mix-blend-mode: normal)  │
│  ├─ Artwork Icons (drop-shadow for edge separation)                  │
│  └─ Trigger Labels & Chevrons (--notch-ink + luminous text-shadow)   │
├──────────────────────────────────────────────────────────────────────┤
│ Z-Layer 80: .viewport-frame > .dyn-notch--frame                      │
│  ├─ mix-blend-mode: difference                                       │
│  └─ High-luminance --frame-color + concave radial-gradient fillets   │
├──────────────────────────────────────────────────────────────────────┤
│ Z-Layer 3: .dyn-notch:not(.dyn-notch--frame) (Frosted Backing Twin)  │
│  ├─ backdrop-filter: blur(16px) saturate(1.35)                       │
│  ├─ Contrast-stabilizing translucent surface tint                    │
│  └─ Synchronized --dyn-w, --dyn-h, and --notch-radius geometry       │
├──────────────────────────────────────────────────────────────────────┤
│ Z-Layer 1: Scrolling / Drifting Movie Poster Wall & Watch Badges     │
└──────────────────────────────────────────────────────────────────────┘
```

- **Interactive Component & State Mapping**:
  - **All 5 Dynamic Notches (`search`, `activities`, `add`, `settings`, `profiles`)**: Both the frosted host twin and the difference-blended frame notch share identical CSS custom properties (`--dyn-w`, `--dyn-h`, `--dyn-peek`, `--dyn-pull-x`, `--dyn-pull-y`, `--notch-radius`), ensuring hover peeks, drag physics, and expanded panel states stay pixel-aligned across desktop and mobile viewports.
  - **TV & Reduced-Motion Fallbacks**: On `.is-tv-runtime` / `.is-silk-browser` or `@supports not (backdrop-filter: blur(1px))`, the frosted backing degrades gracefully to a high-contrast translucent surface without expensive GPU blur passes.
