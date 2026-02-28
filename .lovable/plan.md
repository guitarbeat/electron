

# Mobile UX Improvements

## Problem
On mobile, the app has several usability issues visible in the screenshot:
- The avatar bubbles are oversized, consuming too much vertical space
- The nav bar wraps to two rows (Home, Movies, Places on row 1; Extras on row 2), pushing content far down
- Too much padding and decorative spacing throughout
- The floating message bubble can overlap important content
- Touch targets and spacing aren't optimized for thumb use

## Changes

### 1. Shrink the "Who's Watching" section on mobile
- Reduce avatar `clamp` sizes from `clamp(140px, 35vw, 200px)` to `clamp(90px, 22vw, 140px)` on mobile via a new `size` prop on `GelBubbleAvatar`
- Reduce vertical padding around the user selection area
- Shrink the "Who's watching" header section padding on small screens
- Make the name label font smaller on mobile

**Files:** `components/common/GelBubbleAvatar.tsx`, `components/common/UserSelection.tsx`, `App.tsx`

### 2. Force single-row navigation on mobile
- Set `flex-wrap: nowrap` and `overflow-x: auto` on the nav container so all 4 tabs stay in one row
- Reduce tab `minWidth` from `min(110px, 30vw)` to a smaller value so 4 tabs fit comfortably
- Hide the scrollbar visually while keeping swipe-to-scroll functional
- Reduce font size and icon size slightly at small widths

**Files:** `App.tsx`, `index.html` (add scrollbar-hide utility CSS)

### 3. Tighten mobile spacing globally
- Reduce `main` container top/bottom/side padding on mobile using tighter `clamp()` values
- Reduce the profile section `margin-bottom` on mobile
- Reduce nav `marginBottom` on mobile

**Files:** `App.tsx`

### 4. Mobile-optimized toast positioning
- Move toasts above the floating message bubble by increasing `bottom` offset on mobile
- Ensure toasts don't overlap the nav area

**Files:** `components/watchlist/index.tsx`, `components/places/PlacesList.tsx`

### 5. Fix the build error
- Fix the TypeScript error in `services/dailySpinService.test.ts` where `spunBy` expects a `User` type, not a plain string

**Files:** `services/dailySpinService.test.ts`

## Technical Details
- All responsive adjustments will use the existing `useMediaQuery(breakpoints.sm)` hook or CSS `clamp()` for fluid sizing
- No new dependencies needed
- Avatar sizing will be passed as a prop rather than using media queries inside `GelBubbleAvatar`, since the parent already knows `isMobile` context
- The nav scrollbar hiding will use a small CSS utility class added to `index.html`

