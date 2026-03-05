## Plan: Dismiss bubbles via drag-to-X

**What changes:** When any floating bubble starts being dragged, a dismiss zone (X icon) appears at the bottom center of the screen. Dropping the bubble on the X hides it. Hidden bubbles can be restored from a small toggle button.

### Components affected

All 5 floating bubble components share duplicated drag logic:

- `MessageBoard.tsx` (💬)
- `SpinWheel.tsx` (🎰)
- `SnakeGame.tsx` (🐍)
- `QuizBubble.tsx` (❓)
- `MatchmakerBubble.tsx` (💕)

### Implementation

1. **Create a shared `DragDismissZone` component** — a fixed element at the bottom center that renders an X circle. It accepts `visible: boolean` and `isHovering: boolean` props. Animates in/out with scale+opacity.

2. **Create a `BubbleDismissContext`** — a React context in App.tsx that:
   - Tracks which bubbles are hidden (stored in localStorage for persistence)
   - Tracks whether any bubble is currently being dragged (to show the dismiss zone)
   - Provides `setDragging(id, isDragging)`, `dismiss(id)`, `restore(id)`, `isHidden(id)` methods

3. **Update each bubble component** to:
   - Check `isHidden` from context; if hidden, render nothing
   - On drag start → call `setDragging(id, true)` to show the dismiss zone
   - On drag move → check if bubble overlaps the dismiss zone; if so, set hovering state
   - On drag end → if overlapping dismiss zone, call `dismiss(id)` instead of opening

4. **Add a "restore bubbles" button** — a small fixed button (bottom-left corner) that only appears when at least one bubble is hidden. Shows a menu/list of hidden bubbles to restore individually.

5. **Render `DragDismissZone` once in App.tsx**, connected to context.

### Technical details

- Dismiss zone hit-test: check if bubble center is within ~60px of the dismiss zone center
- localStorage key: `hiddenBubbles` storing an array of IDs
- The dismiss zone appears with a short fade+scale animation when dragging starts
- When hovering over the zone, it grows slightly and turns red to indicate "drop to dismiss"
