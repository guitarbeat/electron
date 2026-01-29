

# Additional Site Improvements Plan

This plan covers new enhancements building on the previous improvements, while continuing to preserve the Papyrus font aesthetic.

---

## 1. Mobile Bottom Sheet for Movie Actions

**Problem:** On mobile, movie action buttons (watched, delete, fix match) are only visible on hover, which doesn't work on touch devices.

**Solution:** Create a bottom sheet component that appears when tapping a movie card on mobile.

**File: `components/ui/BottomSheet.tsx` (new)**
- Slide-up drawer from bottom of screen
- Backdrop overlay with blur effect
- Swipe-down to dismiss gesture support
- Smooth CSS transitions matching existing motion tokens

**File: `components/MovieItem.tsx` (update)**
- Detect mobile using existing `useMediaQuery` hook
- On tap, open bottom sheet with movie title, poster thumbnail, and action buttons
- Actions: Mark as Watched (A/E), Delete, Fix Match
- Close on action completion or backdrop tap

---

## 2. Movie Count & Progress Badge in Header

**Problem:** Users can't see at a glance how many movies are on the list or progress toward watching them together.

**Solution:** Add a subtle stats pill to the Header component.

**File: `components/Header.tsx` (update)**
- Display format: "12 movies • 5 watched together"
- Use existing design tokens for styling
- Pill/badge style with subtle background
- Only visible when user is logged in
- Updates reactively when movies change

---

## 3. Confetti Celebration on Shared Watch Completion

**Problem:** No celebration when both Aaron and Electra mark a movie as watched (a special moment).

**Solution:** Trigger confetti effect when a movie becomes fully watched by both users.

**File: `components/Watchlist.tsx` (update)**
- Track when `watchedBy` goes from 1 to 2 users
- Trigger existing `Confetti` component
- Add toast notification: "You both watched [Movie Title]! 🎉"

**File: `hooks/useMovies.ts` (update)**
- Return callback or flag when shared watch is detected
- Compare previous and current state on movie updates

---

## 4. Suggestion Count Badge & Social Proof

**Problem:** Visitors don't know if their suggestions are being considered or if others have suggested movies.

**Solution:** Show pending suggestion count on the form.

**File: `components/SuggestionForm.tsx` (update)**
- Fetch and display pending suggestion count
- Show "X suggestions pending review" below the form
- Adds social proof and engagement motivation
- Subtle text styling matching existing secondary text

---

## 5. Keyboard Accessibility for Search Results in FixMatchDialog

**Problem:** Search result items in `FixMatchDialog` only have mouse hover states and lack keyboard navigation.

**Solution:** Add focus states and keyboard interaction.

**File: `components/FixMatchDialog.tsx` (update)**
- Add `tabIndex={0}` to each result item
- Add `onKeyDown` handler for Enter/Space to select
- Add `onFocus`/`onBlur` handlers matching hover styles
- Ensure focus is visible with outline or background change

---

## 6. Pulse Animation on Idle Spin Wheel

**Problem:** The spin wheel looks static when idle, missing an opportunity for visual engagement.

**Solution:** Add a subtle pulse animation when the wheel is ready to spin.

**File: `index.html` (update CSS)**
```css
@keyframes wheel-pulse {
  0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(255, 105, 180, 0.3); }
  50% { transform: scale(1.02); box-shadow: 0 0 30px rgba(255, 105, 180, 0.5); }
}

.spin-wheel-wrapper:not(.locked-state):not(.result-state) .spin-wheel-container {
  animation: wheel-pulse 3s ease-in-out infinite;
}
```

---

## 7. Enhanced Empty State for Message Board

**Problem:** Message board may show empty state without engaging visuals when no messages exist.

**File: `components/message-board/MessageList.tsx` (update)**
- Check if message list is empty
- Show friendly empty state: "No messages yet! Start the conversation 💬"
- Add subtle entrance animation
- Include decorative chat bubble icon

---

## 8. Improved Input Accessibility

**Problem:** The reason input in `SuggestionForm` uses a raw `<input>` element without proper accessibility attributes.

**File: `components/SuggestionForm.tsx` (update)**
- Add `aria-label="Add a reason for your suggestion (optional)"`
- Replace raw `<input>` with the existing `Input` component for consistency
- Ensure focus states match other inputs

---

## 9. Add "Retake Quiz" Context for Non-Logged Users

**Problem:** The "Edit Quiz" button is only for logged-in users. Visitors who completed the quiz might want to retake it.

**File: `App.tsx` (update)**
- Show "Retake Quiz" button for visitors who completed quiz (localStorage check)
- Position near the user selection screen
- Clear quiz completion flag and restart quiz flow on click

---

## 10. Progress Indicator for Quiz Flow

**Problem:** Users don't know how many questions remain during the quiz.

**File: `components/quiz/QuizFlow.tsx` (update)**
- Add progress bar or "Question X of Y" indicator
- Use design tokens for styling
- Animate progress bar fill on question change
- Position above or below the question card

---

## Summary Table

| Priority | Task | File(s) | Effort |
|----------|------|---------|--------|
| 1 | Mobile bottom sheet for movie actions | `BottomSheet.tsx`, `MovieItem.tsx` | 25 min |
| 2 | Movie count badge in Header | `Header.tsx` | 10 min |
| 3 | Confetti on shared watch completion | `Watchlist.tsx`, `useMovies.ts` | 15 min |
| 4 | Suggestion count badge | `SuggestionForm.tsx` | 10 min |
| 5 | Keyboard accessibility for FixMatchDialog | `FixMatchDialog.tsx` | 10 min |
| 6 | Pulse animation on spin wheel | `index.html` | 5 min |
| 7 | Enhanced empty state for messages | `MessageList.tsx` | 10 min |
| 8 | Improved input accessibility | `SuggestionForm.tsx` | 5 min |
| 9 | Retake Quiz button for visitors | `App.tsx` | 10 min |
| 10 | Progress indicator for quiz | `QuizFlow.tsx` | 15 min |

---

## Technical Notes

**Font Preservation:** All UI additions will use the typography tokens which enforce Papyrus:
```typescript
fontFamily: {
  heading: ['Papyrus', 'fantasy'],
  body: ['Papyrus', 'fantasy'],
  sans: ['Papyrus', 'fantasy'],
}
```

**Lock File Reminder:** The project still needs a lock file generated by running `pnpm install` locally and committing the `pnpm-lock.yaml` file for consistent builds.

**Mobile Detection:** Uses existing `useMediaQuery` hook with `breakpoints.sm` (640px) for responsive behavior.

