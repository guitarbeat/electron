# Frost-Clear Command Bar & Expanding Difference-Frame Entrance Sequence

Elevate the Unified Retro Y2K Command Bar above the top frost glow so controls stay razor-sharp, upgrade the initial loading experience with an Aaron & Electra retro arcade center badge, and choreograph the `mix-blend-mode: difference` border frame to wrap the center loading badge at launch before expanding outward to the viewport edges once the collection is ready.

## User Review & Critical Decisions

> [!IMPORTANT]
> All core design and choreography choices have been confirmed from your answers:

- **Difference Border Origin & Choreography**: The `mix-blend-mode: difference` border frame starts tightly wrapped around the central loading badge in the middle of the screen, then expands smoothly outward to the full viewport edges.
- **Retro Arcade Loading Badge**: Inside the initial center frame, Aaron and Electra's pixel/cutout avatars appear side-by-side with a retro Y2K arcade progress indicator and status readout while the poster wall prepares in the background.
- **Trigger Timing**: The outward frame expansion and badge dissolve trigger as soon as the app shell and poster collection are ready (with a brief minimum beat on cached loads so the expansion transition always feels intentional and smooth).
- **Command Bar Above Frost Glow**: The top frost vignette blurs only the drifting poster wall beneath it, while the Unified Y2K Frosted Capsule Command Bar and bottom profile dock sit on a higher elevation plane completely free of edge-blur distortion.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Frost-Clear Command Bar Layering**: Restructures the viewport elevation stack so the edge frost glow (`Vignette`) applies strictly to the drifting poster wall canvas (`z-index: 15`), while the Unified Y2K Command Bar (`z-index: 60`) and quick profile dock (`z-index: 65`) float crisp and unblurred above it.
  2. **Aaron & Electra Retro Arcade Loading Screen**: Replaces the generic loading spinner and bare skeleton tiles with a cohesive Y2K arcade loading stage featuring Aaron and Electra's avatars, a dual-player ready indicator, a segmented phosphor progress bar, and ambient shimmering poster columns.
  3. **Expanding `mix-blend-mode: difference` Frame Sequence**: Turns the signature inverted viewport border into a living entrance animation—starting as the glowing `mix-blend-mode: difference` border around the center Aaron & Electra arcade badge during load, then sweeping outward across the poster wall to lock into the full-viewport frame once ready.
- **Target Audience / Persona**: Aaron and Electra opening their shared movie & place collection on desktop or mobile.
- **Key Value**: Eliminates the washed-out blur over the top command bar and transforms initial site load into a playful, custom couple's arcade intro.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Pre-Mount & Initial Load (Center Badge Framed)**:
     - Immediately on page load, the dark midnight canvas (`#07091a`) displays a centered Y2K arcade loading badge (`~320px × 208px` on desktop, `~276px × 192px` on mobile).
     - The `mix-blend-mode: difference` border (`#999999`, `7px` desktop / `5px` mobile, `24px` corner radius) wraps tightly around the perimeter of this center badge.
     - Inside the badge, Aaron and Electra's avatars sit side-by-side above a `"LOADING COLLECTION"` readout and a segmented cyan/pink arcade progress bar while softly shimmering poster silhouettes drift behind the frost vignette.
  2. **Outward Difference-Border Expansion (Ready Reveal)**:
     - As soon as the app shell and collection data are ready, the center arcade badge flashes a brief `"READY"` highlight and scales/fades out (`scale(1.06)`, `opacity: 0` over `280ms`).
     - Simultaneously, the `mix-blend-mode: difference` border expands outward from the center badge geometry to the full viewport edges (`100vw × 100dvh`, `20px` corner radius) over `650ms` using an expressive spring-out curve (`cubic-bezier(0.16, 1, 0.3, 1)`).
     - As the thick difference border travels across the emerging poster tiles and top command bar, it dynamically inverts the colors beneath it before settling into the outer viewport frame.
  3. **Active Browsing Above the Frost Glow**:
     - Once settled, the drifting poster wall glides underneath the top/bottom/side frost glow (`Vignette`), while the Unified Y2K Frosted Capsule Command Bar at the top remains crystal-clear with sharp typography, high-contrast sky-blue accents, and unblurred filter/sort popovers.

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Y2K Couple's Arcade & Tactile Frosted Glass.
  - *Color Palette & Mood*:
    - `--background`: `#07091a` (deep midnight arcade canvas)
    - `--surface-dock`: `rgba(9, 14, 28, 0.86)` with `backdrop-filter: blur(22px) saturate(180%)`
    - `--primary` / `--accent`: `#38bdf8` (luminous sky cyan) paired with `#f472b6` (arcade rose) for dual-partner avatar accents
    - `--frame-color`: `#999999` with `mix-blend-mode: difference`
  - *Typography & Hierarchy*:
    - Arcade badge header & status: `Plus Jakarta Sans` / `JetBrains Mono` (`0.75rem`, `700` weight, `0.08em` tracking, tabular numerals).
    - Command bar input & controls: `0.9rem` medium-semibold (`550–700`) with crisp contrast above the frost layer.

- **Interactive Feedback & Motion**:
  - Outward frame expansion animates smoothly from center badge inset to `inset: 0` using hardware-accelerated geometry/clip-path transitions.
  - Users with `prefers-reduced-motion: reduce` enabled bypass the expansion sweep and see the full-viewport frame immediately.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Dissolving Stacking-Context Traps to Elevate the Command Bar Above `Vignette`**
  - *Chosen Approach*: Lower the `Vignette` edge-blur layer (`z-index: 15`) and inner viewport shadow so they sit directly above the drifting poster wall (`z-index: 1`), while removing the intermediate `z-index: 1` stacking-context lock on the workspace containers and positioning the Unified Y2K Command Bar at `z-index: 60`.
  - *Why*: Previously, the workspace wrapper created a root stacking context at `z-index: 1`, trapping every child inside it (even those with `z-index: 520`) underneath the root `Vignette` (`z-index: 50`). Separating the poster wall plane (`z-index: 1`) from the HUD plane (`z-index: 60`) lets the top frost glow blur the scrolling posters behind the search bar while keeping the search bar itself 100% sharp.
  - *Alternatives Considered*: Reducing the blur strength of `.vignette-top` was rejected because the strong edge frost looks great on the scrolling posters; the command bar simply needed to sit above that blur plane.

- **Decision 2: Unified Center-to-Edge `ViewportFrame` State Machine**
  - *Chosen Approach*: Enhance `ViewportFrame` (`FrameEffect`) with an optional `expanded` / entrance state driven by workspace readiness while keeping its default static render markup unchanged when no entrance props are active.
  - *Why*: Using the actual `ViewportFrame` element to frame the center Aaron & Electra loading badge and then expand to the viewport perimeter guarantees a seamless single-element morph with authentic `mix-blend-mode: difference` inversion across the entire reveal, while preserving backward compatibility with all existing unit tests.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌───────────────────────────────────────────────────────────────────────────┐
│                           Root App Shell (z-stack)                        │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  [z-index: 80]  ViewportFrame (mix-blend-mode: difference)                │
│                 ├─ Load State: Wraps Center Arcade Badge (21rem × 13.5rem)│
│                 └─ Ready State: Expands outward to Full Viewport (inset:0)│
│                                                                           │
│  [z-index: 75]  Center Arcade Loading Badge (Aaron & Electra Avatars)     │
│                 └─ Dissolves & scales out as ViewportFrame expands        │
│                                                                           │
│  [z-index: 60]  Unified Y2K Command Bar & Profile Dock (Above Frost!)     │
│                 ├─ Search Capsule + Add Movie / Place                     │
│                 └─ Docked Filter Popover + Sort Menu                      │
│                                                                           │
│  [z-index: 15]  Vignette Frost Glow (Top / Bottom / Left / Right)         │
│                 └─ Blurs only the poster wall drifting underneath         │
│                                                                           │
│  [z-index: 1]   DriftWall Poster Canvas                                   │
│                 └─ Ambient scrolling movie, suggestion, and place cards   │
└───────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State**:
  - `isEntranceReady`: Boolean state derived from workspace mount + collection readiness (with a short minimum initial frame hold of `~420ms` so the center badge frame is visibly established before expanding outward).
  - `FrameStage`: `'compact' | 'expanding' | 'expanded'` state controlling the `.viewport-frame` CSS classes (`viewport-frame--compact`, `viewport-frame--expanding`) so the frame transitions cleanly from the center badge dimensions (`width: min(21rem, 86vw); height: 13.25rem`) to full viewport (`width: 100vw; height: 100dvh; inset: 0`).

- **Interactive Component & State Mapping**:
  - **Initial HTML Shell (`#root:empty`)**: Displays a matching centered arcade frame silhouette so there is zero jarring flash before React mounts.
  - **Center Arcade Loading Badge**: Renders Aaron (`/aaron-avatar.png`) and Electra (`/electra-button.png`) avatars, partner tags, and a segmented arcade progress bar inside the exact bounding box framed by `.viewport-frame--compact`.
  - **Outward Expansion Trigger**: When `collectionState !== "loading"` (or after fallback timeout so a slow network never traps the user), transitions `.viewport-frame` to full screen while fading out the center badge and sliding in the frost-clear Y2K Command Bar.
