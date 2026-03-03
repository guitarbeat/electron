

# Refactor Dashboard.tsx + Y2K Theme Enhancement

## Problem
Dashboard.tsx is broken -- two component definitions (old `Dashboard` and new `MiniPreview`) got merged/interleaved, producing ~25 build errors (unclosed tags, duplicate declarations, mixed code). The file needs a clean rewrite.

## Plan

### 1. Rewrite Dashboard.tsx from scratch
The file currently has two overlapping implementations. I'll consolidate into a clean, working component using the `MiniPreview` accordion pattern (the newer, better approach):

- **Remove** duplicate imports (e.g., two `MainTab` imports on lines 2-3), orphaned `sectionLabel` style that cuts off mid-object, and all interleaved old code
- **Keep** the `MiniPreview` collapsible card pattern with chevron toggle, "Open Full" link, and grid-based item layout
- **Keep** the outer `Dashboard` component that creates movie and place preview cards
- Structure: `MiniPreview` (reusable accordion card) + `Dashboard` (uses two MiniPreviews for movies and places)

### 2. Y2K theme enhancements
Layer more Y2K aesthetic elements into the Dashboard and global styles:

**Dashboard cards:**
- Add iridescent/holographic gradient borders (shifting pink-to-blue-to-purple)
- Use glossy gel-style section headers with inner highlight shine
- Add subtle star/sparkle decorators (Unicode ✦ ✧ ★) in section headers
- Use brighter neon accent colors for interactive elements

**Global (index.html styles):**
- Add a `@keyframes iridescent` animation for shimmering rainbow border effects
- Add a `.y2k-card` utility class with holographic border + inner glow
- Add a `.y2k-header` class with gradient text + sparkle text-shadow
- Enhance the existing retro-divider with an animated shimmer

**Dashboard.css:**
- Add hover states with Y2K-style glow pulses
- Add iridescent border animation to section cards on hover

### Technical details

**Dashboard.tsx structure (clean rewrite):**
```text
MiniPreview component
  - Collapsible accordion with chevron
  - Click header to expand/collapse
  - "Open Full" button navigates to tab
  - Grid layout for items (2 columns)
  - Accepts: title, icon, items[], onNavigate, isLoading, accentColor

Dashboard component  
  - Fetches movies + places via hooks
  - Renders two MiniPreview cards
  - Movies: unwatched, shows poster thumbnails
  - Places: unvisited, shows name
```

**Files to modify:**
1. `components/main/Dashboard.tsx` -- full rewrite (fix all build errors + Y2K styling)
2. `components/main/Dashboard.css` -- add Y2K hover/glow animations
3. `index.html` -- add Y2K utility classes and iridescent keyframes (in existing `<style>` block)

