

# Y2K Dark Romantic Profile Selection Redesign

Transform the profile selection page into a stunning Y2K-inspired dark romantic interface with gel-style floating bubbles, pixel-art stars, and a split-screen layout.

---

## Overview

Completely redesign the UserSelection component with:
- **Vertical 50/50 split layout** for Aaron and Electra
- **Gel-style floating bubbles** containing profile avatars with soft bounce animation
- **Y2K dark romantic aesthetic** with deep purple/midnight blue gradients
- **Pixel-art stars** and subtle heart patterns in the background
- **Neon-pink glowing edges** throughout the interface
- **Chunky glossy "Take Personality Quiz" button** with plastic texture
- Preserved Papyrus font throughout

---

## Visual Design

```text
┌─────────────────────────────────────────────┐
│  ★    ·    ★    ·    ★    ·    ★    ·    ★  │  <- Pixel stars layer
├──────────────────┬──────────────────────────┤
│                  │                          │
│   ╭─────────╮    │    ╭─────────╮           │
│   │ ◠─────◠ │    │    │ ◠─────◠ │           │  <- Gel bubbles with
│   │  Aaron  │    │    │ Electra │           │     soft bounce animation
│   │  avatar │    │    │  avatar │           │
│   ╰─────────╯    │    ╰─────────╯           │
│                  │                          │
│    ┌───────┐     │     ┌───────┐            │
│    │ Aaron │     │     │Electra│            │  <- Names below bubbles
│    └───────┘     │     └───────┘            │
│      🔒          │        🔒                │  <- Lock icons if PIN set
├──────────────────┴──────────────────────────┤
│                                             │
│  ┌─────────────────────────────────────────┐│
│  │  ✨ Take Personality Quiz ✨            ││  <- Chunky glossy button
│  └─────────────────────────────────────────┘│
│                                             │
└─────────────────────────────────────────────┘
         Background: Purple/blue gradient
         with pixel stars and heart patterns
```

---

## Implementation Details

### 1. New Component: ProfileSelectionScreen

**File: `components/ProfileSelectionScreen.tsx`** (New)

A completely new component replacing the current card-based layout:

- **Full-screen split layout**: Vertical divider with Aaron on left, Electra on right
- **Gradient background**: Deep purple (#2d1b4e) to midnight blue (#1a1a3e)
- **Pixel-art stars**: CSS-generated twinkling star field using pseudo-elements
- **Subtle heart patterns**: Semi-transparent heart overlay (reusing existing pattern)
- **Glowing neon divider line**: Animated pink/purple glow down the center

### 2. New Component: GelBubbleAvatar

**File: `components/GelBubbleAvatar.tsx`** (New)

The translucent gel-style floating sphere:

- **Gel appearance**: Layered gradients with inner glow and outer shine
- **Glossy reflections**: White highlight at top-left, softer reflection at bottom
- **Translucent effect**: rgba backgrounds with backdrop-filter blur
- **Bounce animation**: Soft up-down floating using CSS keyframes
- **Hover/tap effects**: Scale up slightly, intensify glow
- **Profile image**: Centered inside the bubble with rounded clipping
- **Lock badge**: Small overlay if user has PIN protection

### 3. New Component: GlossyQuizButton

**File: `components/GlossyQuizButton.tsx`** (New)

Chunky plastic-textured button:

- **Plastic texture**: Multiple gradient layers for 3D plastic look
- **Glossy shine**: Animated shimmer effect across the surface
- **Thick border**: Raised 3D appearance with outset border
- **Pink glow**: Neon edge glow on all sides
- **Press animation**: Satisfying "squish" effect on click

### 4. Update UserSelection Component

**File: `components/UserSelection.tsx`** (Update)

Refactor to use the new components:
- Replace Card layout with ProfileSelectionScreen
- Use GelBubbleAvatar for each user
- Use GlossyQuizButton for quiz CTA
- Keep existing PIN dialog logic intact
- Keep SuggestionForm at bottom

### 5. Add Y2K Animations to index.html

**File: `index.html`** (Update)

Add new CSS keyframes:
- `@keyframes gel-bounce`: Soft floating bounce (transform: translateY)
- `@keyframes twinkle`: Star twinkling effect (opacity pulse)
- `@keyframes neon-pulse`: Glowing edge animation
- `@keyframes shimmer-plastic`: Glossy button shine sweep

---

## Technical Details

### Gel Bubble Styling

```css
/* Multi-layer gradient for gel appearance */
background: 
  radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.4) 0%, transparent 50%),
  radial-gradient(circle at 50% 50%, rgba(147, 112, 219, 0.6) 0%, rgba(75, 0, 130, 0.3) 100%);

/* Inner and outer glow */
box-shadow: 
  inset 0 -20px 30px rgba(255,255,255,0.1),
  inset 0 10px 20px rgba(255,255,255,0.3),
  0 0 40px rgba(255, 105, 180, 0.4),
  0 0 80px rgba(147, 112, 219, 0.3);
```

### Bounce Animation

```css
@keyframes gel-bounce {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-12px); }
}
.gel-bubble {
  animation: gel-bounce 3s ease-in-out infinite;
}
/* Offset animation for second bubble */
.gel-bubble-offset {
  animation-delay: 1.5s;
}
```

### Pixel Star Field

```css
/* CSS-only pixel stars using box-shadow */
.pixel-stars::before {
  content: '';
  position: absolute;
  width: 2px;
  height: 2px;
  background: white;
  box-shadow: 
    50px 80px white, 120px 40px white, 200px 100px white,
    /* ... many more scattered positions */;
  animation: twinkle 4s ease-in-out infinite;
}
```

### Glossy Plastic Button

```css
background: 
  linear-gradient(180deg, 
    rgba(255,255,255,0.3) 0%, 
    rgba(255,255,255,0.1) 40%,
    transparent 60%,
    rgba(0,0,0,0.2) 100%),
  linear-gradient(135deg, #ff69b4 0%, #ff8bb3 50%, #ff69b4 100%);

border: 4px outset rgba(255,255,255,0.5);
border-radius: 16px;
box-shadow: 
  0 6px 0 rgba(180, 50, 120, 1),
  0 8px 20px rgba(0,0,0,0.5),
  0 0 30px rgba(255, 105, 180, 0.5),
  inset 0 2px 0 rgba(255,255,255,0.4);
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `components/ProfileSelectionScreen.tsx` | Create | Full-screen split layout with Y2K background |
| `components/GelBubbleAvatar.tsx` | Create | Translucent gel sphere with bounce animation |
| `components/GlossyQuizButton.tsx` | Create | Chunky plastic-textured button |
| `components/UserSelection.tsx` | Update | Integrate new components |
| `index.html` | Update | Add gel-bounce, twinkle, neon-pulse keyframes |

---

## Accessibility

- Gel bubbles are clickable with clear focus states
- Keyboard navigation preserved (Tab between profiles, Enter to select)
- ARIA labels on profile buttons
- Animations respect `prefers-reduced-motion`
- High contrast text on gradient backgrounds
- PIN dialog interaction unchanged

---

## Mobile Responsiveness

- On mobile: Stack profiles vertically instead of side-by-side
- Smaller gel bubbles that still bounce
- Quiz button spans full width
- Touch-friendly tap targets (minimum 44px)
- Reduced animation intensity on mobile for performance

