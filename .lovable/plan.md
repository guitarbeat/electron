

## Make movie details fullscreen on mobile

When a user taps a movie card on a phone, the details modal should expand to fill the entire viewport so posters, plot, and metadata are easy to read. Desktop stays as-is (centered, 640px wide).

### What changes
- **`MovieDetailsModal`** detects mobile (already uses `useMediaQuery`) and renders the modal in a new `fullscreen` mode on phones.
- **`Modal`** (`src/components/ui/modals/index.tsx`) gains a `variant="fullscreen"` option that:
  - Pins the dialog to all four edges (top/right/bottom/left = 0)
  - Uses `100dvw` × `100dvh` with safe-area insets respected
  - Removes the rounded corners and centered transform
  - Keeps the existing header (title + close button) so the user can dismiss
- Inside the modal body on mobile, the layout stacks vertically with a larger poster (full-width, capped height ~50dvh) and roomy padding so the plot text is comfortably readable.

### Technical notes
- Centered/bottom-sheet variants are untouched — only a new `fullscreen` branch is added to the `modalStyle` switch.
- `MovieDetailsModal` passes `variant={isMobile ? 'fullscreen' : 'centered'}` and adjusts its inner padding/poster sizing when `isMobile` is true.
- Body scroll-lock and focus trap already work via `useModalBase`, no change needed.

### Files touched
- `src/components/ui/modals/index.tsx` — add `'fullscreen'` to `variant` union and corresponding style block
- `src/components/watchlist/MovieDetailsModal.tsx` — pick variant by viewport, tweak inner layout for mobile

