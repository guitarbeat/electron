# Moving Wall Watch Status Indicators

Add instant visual recognition for **Watched**, **Currently Watching**, and **Not Yet Seen** movies directly on the moving poster wall so Aaron and Electra can scan the drifting grid at a glance without opening individual movie cards.

## User Review & Critical Decisions

> [!IMPORTANT]
> The visual treatments below incorporate all three preferences confirmed during planning:
> - **Confirmed Decision 1 (Watched & Watching Indicators)**: Combine color-coded glowing poster borders, compact corner mini-avatars with color-coded status rings, and dimmed/desaturated artwork for already-watched posters.
> - **Confirmed Decision 2 (Unseen Poster Treatment)**: Keep movies that have not yet been seen completely clean with full-brightness artwork and zero badge clutter.
> - **Confirmed Decision 3 (Filter Controls)**: Keep status filtering inside the existing Filter popover menu without adding extra quick-toggle pills to the top command bar.

---

## 1. Overview & Core Concept

- **What It Does**: Gives every poster on the moving wall (`DriftWall`) a distinct, immediate visual signature based on whether either partner is currently watching it, has already watched it, or hasn't seen it yet.
- **Target Audience / Persona**: Aaron and Electra browsing the moving poster wall together to pick their next watch or see what is currently in progress.
- **Key Value**: Eliminates guesswork while panning across dozens of moving posters—unwatched discoveries pop at full vibrancy, in-progress titles glow warmly, and completed watches recede subtly while showing who watched them.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Scanning the Moving Wall**:
     - **Not Yet Seen (Unwatched)**: Renders at 100% poster vibrancy with a clean border and zero corner badges so discovery remains uncluttered.
     - **Currently Watching**: Stands out with a warm amber/gold glowing border (`#f59e0b` / `rgba(251, 191, 36, 0.78)`), a subtle ambient outer halo, and compact circular mini-avatars in the bottom-right corner ringed in glowing amber with a mini play/watching status badge.
     - **Already Watched**: Recedes visually with desaturated, dimmed poster artwork (`saturate(0.38) brightness(0.68)` and reduced base opacity), paired with an emerald-green status border (`#10b981` / `rgba(52, 211, 153, 0.55)`) and corner mini-avatars ringed in emerald green with a crisp checkmark status badge.
  2. **Hover & Focus Inspection**:
     - Hovering or focusing any dimmed **Watched** poster smoothly restores full poster brightness and color saturation so artwork and details remain effortless to inspect.
  3. **Toggling Status from Detail Modal**:
     - Marking a movie as *Watching* or *Watched* inside the detail modal immediately updates the poster's border glow, artwork saturation, and corner watcher badges on the moving wall.

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Cinematic dark glassmorphism consistent with the existing synthwave/editorial poster wall.
  - *Color Palette & Status Tokens*:
    - **Watching Accent**: Warm Amber (`#f59e0b`, border glow `rgba(251, 191, 36, 0.72)`, outer halo `rgba(245, 158, 11, 0.28)`).
    - **Watched Accent**: Emerald Teal (`#10b981`, border glow `rgba(52, 211, 153, 0.52)`, subtle inner frame).
    - **Unwatched Surface**: Existing clean glass frame (`var(--color-border)`) at full contrast.
  - *Corner Mini-Avatar Stack*:
    - Positioned in the bottom-right corner of the poster (`28px` circular avatars with slight horizontal overlap when both Aaron and Electra appear).
    - Dark glass backing (`rgba(12, 10, 18, 0.88)`), `2px` color-coded status ring (amber for watching, emerald for watched), and a `12px` corner status indicator dot (`▶` pulse dot for watching, `✓` check for watched).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Three-Signal Hierarchy (Border + Dimming + Corner Avatar Ring)**
  - *Chosen Approach*: Combine poster-level treatments (glowing status border + watched desaturation) with person-level treatments (compact ringed mini-avatars in the corner).
  - *Why*: During fast panning or zoomed-out views on the moving wall, border color and poster brightness are readable from afar, while the corner mini-avatars answer *who* watched or is watching up close.
  - *Alternatives Considered*: Text ribbon banners across the top of posters were passed over because they obscure poster typography and add visual noise.
- **Decision 2: Zero-Clutter Unseen Posters**
  - *Chosen Approach*: Render no corner badges, status pills, or extra rings when `watchedBy` and `watchingBy` are both empty.
  - *Why*: Since the primary goal of the wall is discovering what to watch next, unseen posters should command the strongest visual contrast and cleanest presentation.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Moving Poster Wall                              │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Movie item state derivation (watchedBy[] + watchingBy[])          │  │
│  │  ├─ "watching"     (watchingBy.length > 0)                        │  │
│  │  ├─ "watched-both" (watchingBy.length === 0 && watchedBy >= 2)    │  │
│  │  ├─ "watched"      (watchingBy.length === 0 && watchedBy === 1)   │  │
│  │  └─ "unwatched"    (both empty)                                   │  │
│  └───────────────┬───────────────────────────────────┬───────────────┘  │
│                  │                                   │                  │
│                  ▼                                   ▼                  │
│  ┌───────────────────────────────┐   ┌───────────────────────────────┐  │
│  │ Poster Frame & Artwork Layer  │   │ Corner Watcher Avatar Stack   │  │
│  │  • Status border & outer glow │   │  • Hidden when "unwatched"    │  │
│  │  • Dim/desaturate on watched  │   │  • 28px circular avatar photo │  │
│  │  • Full vibrancy on hover     │   │  • Status ring (Amber/Green)  │  │
│  └───────────────────────────────┘   └───────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State**:
  - Uses existing movie fields (`watchedBy: User[]` and `watchingBy?: User[]`) with no schema migrations required.
  - Derives a deterministic `watchState` attribute (`"unwatched" | "watching" | "watched" | "watched-both"`) on each poster card container.
- **Interactive Component & State Mapping**:
  - **Poster Container (`data-watch-state`)**: Drives hardware-accelerated CSS border glow, ambient shadow, and poster image filter transitions (`filter`, `opacity`, `border-color`, `box-shadow`).
  - **Watcher Stack & Mini-Avatar Badges**: Renders only when at least one user is in `watchingBy` or `watchedBy`. Each avatar displays a circular clipped photo (with initial fallback), a status-colored ring (`watching` vs `watched`), and a micro status badge in the lower-right corner of the avatar.
