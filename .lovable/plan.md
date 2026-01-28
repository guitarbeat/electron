

# Site Improvements Plan

This plan covers multiple enhancements to make the site better while preserving the Papyrus font aesthetic.

---

## 1. Visual Polish & Micro-Interactions

### 1a. Add Floating Hearts Background Animation
Enhance the ambient atmosphere with subtle floating heart particles that match the romantic aesthetic.

**Changes to `index.html`:**
- Add CSS keyframe animation for floating hearts
- Create small SVG heart particles that drift upward slowly
- Low opacity (0.03-0.08) to avoid distraction
- Randomized sizes and animation durations

### 1b. Add Hover Sound Effects (Optional CSS Animations)
Add subtle CSS-only visual feedback animations to make interactions feel more responsive.

**Changes to multiple components:**
- Add "wiggle" animation on hover for buttons
- Add subtle "pulse" effect to the spin wheel when idle
- Add "sparkle" border animation on focused input fields

---

## 2. Improved Empty States & Loading States

### 2a. Enhanced Loading Skeletons
Replace basic "Loading..." text with animated skeleton components that match the card layouts.

**New file: `components/ui/Skeleton.tsx`**
- Reusable skeleton component with configurable shapes
- Matches the card styling with proper border radius
- Uses existing design tokens

**Updates to affected components:**
- `Watchlist.tsx` - skeleton grid for movie cards
- `WatchlistPreview.tsx` - already has skeleton, add subtle glow effect
- `SuggestionList.tsx` - skeleton for suggestions

### 2b. Delightful Empty States
Add illustrated/emoji-based empty states with encouraging messages.

**Updates:**
- `Watchlist.tsx` - "Your watchlist is waiting for movies! 🎬" with a subtle animation
- `SuggestionList.tsx` - "No suggestions yet! Share this page with friends" 

---

## 3. Enhanced User Feedback

### 3a. Confetti Animation on Special Events
Add celebration effects for key moments.

**New file: `components/effects/Confetti.tsx`**
- Lightweight CSS-only confetti burst
- Trigger on: first movie added, movie watched by both, suggestion accepted

### 3b. Improved Toast Notifications
Enhance the existing Toast component.

**Updates to `components/ui/Toast.tsx`:**
- Add dismiss button for accessibility
- Add stacking support for multiple toasts
- Add different icons for success/error/info types
- Add entrance/exit animations

---

## 4. Accessibility Improvements

### 4a. Add Missing ARIA Labels
Based on `.Jules/palette.md` guidance, add proper aria-labels.

**Updates to multiple files:**
- `IconButton` usages throughout - add `aria-label` where only `title` exists
- `Watchlist.tsx` - view toggle button needs aria-label
- `Header.tsx` - PIN and logout buttons

### 4b. Focus-Visible Improvements
Add consistent focus rings across all interactive elements.

**Updates to `index.html` CSS:**
- Add `:focus-visible` styles for better keyboard navigation
- Ensure focus rings match the accent color

### 4c. Skip Link Enhancement  
Already exists in App.tsx - verify it's working properly.

---

## 5. Performance & Polish

### 5a. Add Image Lazy Loading
Ensure all movie poster images have `loading="lazy"` attribute.

**Updates:**
- `MovieItem.tsx` - add `loading="lazy"` to poster images
- `WatchlistPreview.tsx` - already has it, verify it's consistent

### 5b. Add Smooth Scroll Behavior
Enable smooth scrolling globally.

**Updates to `index.html`:**
```css
html {
  scroll-behavior: smooth;
}
```

### 5c. Preload Critical Fonts
Add Papyrus font preload hint for faster rendering.

**Updates to `index.html`:**
- Add `<link rel="preload">` for Papyrus if available as web font
- Fallback already configured in design tokens

---

## 6. Feature Enhancements

### 6a. Movie Count Badge in Header
Show total movies and watched progress.

**Updates to `components/Header.tsx`:**
- Add small stats display: "12 movies • 5 watched together"
- Use subtle pill badge styling

### 6b. Quick Retake Quiz Button for Logged-In Users  
Already exists as "Edit Quiz" - consider renaming to "Retake Quiz" for visitors who completed it.

### 6c. Suggestion Count Badge
Show pending suggestion count on the visitor-facing form.

**Updates to `components/SuggestionForm.tsx`:**
- Display "X suggestions pending review" if there are any
- Adds social proof that suggestions are being considered

---

## 7. Mobile Experience

### 7a. Pull-to-Refresh Indicator
Add visual hint for mobile users that they can pull down to refresh.

**Updates to `components/Watchlist.tsx`:**
- Add subtle refresh icon at top when user scrolls past top
- Pure CSS/visual only (actual refresh uses existing polling)

### 7b. Bottom Sheet for Movie Actions
On mobile, show movie actions in a bottom sheet instead of hover overlay.

**Updates to `components/MovieItem.tsx`:**
- Detect mobile via `useMediaQuery`
- On tap, expand to show action buttons more prominently
- Add smooth height transition

---

## 8. Code Quality

### 8a. Install Tailwind Properly (Recommended but Optional)
The CDN warning appears in console. Consider installing Tailwind as a dev dependency.

This is a larger change and can be deferred if you prefer keeping the current setup.

### 8b. Add Lock File Note
Remind about generating `pnpm-lock.yaml` for consistent builds.

---

## Implementation Priority

| Priority | Task | Effort |
|----------|------|--------|
| 1 | Add missing ARIA labels | 15 min |
| 2 | Enhanced Toast with dismiss button | 10 min |
| 3 | Movie count badge in Header | 10 min |
| 4 | Floating hearts background animation | 15 min |
| 5 | Improved loading skeletons | 20 min |
| 6 | Confetti on special events | 20 min |
| 7 | Delightful empty states | 10 min |
| 8 | Mobile bottom sheet for actions | 25 min |
| 9 | Focus-visible improvements | 10 min |
| 10 | Smooth scroll + image lazy loading | 5 min |

---

## Technical Notes

**Font Preservation**: All changes maintain the Papyrus font family defined in `design-system/tokens.ts`. The typography system will continue using:
```typescript
fontFamily: {
  heading: ['Papyrus', 'fantasy'],
  body: ['Papyrus', 'fantasy'],
  sans: ['Papyrus', 'fantasy'],
}
```

**Lock File**: The project is missing a lock file. You should run `pnpm install` locally and commit the generated `pnpm-lock.yaml` to ensure consistent dependency versions across environments.

