

# Enhanced Watchlist Preview for Visitors

Redesign the visitor-facing watchlist preview to show movie posters in an attractive grid layout, giving visitors a visual understanding of what's already on the watchlist before they suggest a movie.

---

## Current State

The `WatchlistPreview` component currently shows:
- A simple text list of unwatched movie titles
- A "1/2 Watched" badge for movies one person has seen
- Basic styling with no visual appeal (no posters)
- Limited to 150px height with scroll

---

## Proposed Design

### Visual Approach

Transform the preview into a **horizontal scrolling poster gallery**:
- Show movie poster thumbnails in a compact horizontal strip
- Hover/tap reveals movie title overlay
- Visual "watched by 1" indicator badges
- Empty state shows friendly message encouraging first suggestion
- Matches the existing retro aesthetic with pink/blue accents

### Layout Options

**Option A: Horizontal Poster Strip** (Recommended)
- Compact row of poster thumbnails (60-80px wide)
- Smooth horizontal scroll on mobile
- Hover shows title tooltip
- Maximum of 8-10 visible at once

**Option B: Mini Masonry Grid**
- 2-3 columns of small poster cards
- More visible at once but takes more vertical space
- Similar to the main Watchlist grid but miniaturized

---

## Implementation Details

### 1. Update `WatchlistPreview.tsx`

**Changes:**
- Replace the text list with a poster-based layout
- Add horizontal scroll container with snap points
- Include poster fallback for movies without images
- Add hover states with title reveal
- Show watched status badge (A/E indicators like in MovieItem)
- Add movie count summary

**New Structure:**
```text
┌─────────────────────────────────────────────┐
│ 🎬 Current Watchlist (5 movies)            │
├─────────────────────────────────────────────┤
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ → scroll │
│ │ 🎬 │ │ 🎬 │ │ 🎬 │ │ 🎬 │ │ 🎬 │          │
│ │    │ │    │ │    │ │    │ │    │          │
│ │[E] │ │    │ │[A] │ │    │ │    │          │
│ └────┘ └────┘ └────┘ └────┘ └────┘          │
└─────────────────────────────────────────────┘
```

### 2. Poster Card Features

Each poster thumbnail will include:
- **Movie poster image** (using `posterUrl` from metadata)
- **Fallback gradient** with FilmIcon for movies without posters
- **Title overlay** on hover/focus (semi-transparent background)
- **Watcher badge** (small A/E circles like in MovieItem)
- **Year badge** if available (subtle, bottom corner)

### 3. Empty State

When no unwatched movies exist:
```text
"The watchlist is empty! Be the first to suggest a movie 🎬"
```

### 4. Responsive Behavior

- **Desktop**: Horizontal scroll with hover effects
- **Mobile**: Touch-friendly horizontal scroll with snap points
- Poster sizes slightly smaller on mobile (50-60px vs 70-80px)

---

## Technical Specification

### File Changes

| File | Action | Description |
|------|--------|-------------|
| `components/WatchlistPreview.tsx` | Rewrite | Complete redesign with poster grid |

### New Component Structure

```typescript
// Poster dimensions
const POSTER_WIDTH = 70; // px
const POSTER_HEIGHT = 105; // 2:3 aspect ratio

// Features:
// - Horizontal scroll container with overflow-x: auto
// - CSS scroll-snap for smooth mobile scrolling
// - Movie poster with lazy loading
// - Gradient overlay with title on hover
// - Watched-by badges (A/E indicators)
// - Loading skeleton that matches poster shape
```

### Styling Approach

- Use existing design tokens (`spacing`, `colors`, `radius`, `shadows`)
- Reuse badge styling from `MovieItem.tsx` for consistency
- Add hover scale effect (transform: scale(1.05))
- Gradient overlay: `linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 50%)`

---

## Accessibility Considerations

- All posters have proper `alt` text with movie title
- Scroll container has `role="list"` with poster items as `role="listitem"`
- Focus states visible for keyboard navigation
- Title always available (not just on hover) via `title` attribute

---

## Visual Consistency

The enhanced preview will match the main Watchlist's `MovieItem` styling:
- Same poster aspect ratio (2:3)
- Same watcher badge design (A/E circles)
- Same gradient overlay treatment
- Same fallback styling for missing posters

