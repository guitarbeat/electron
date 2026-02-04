
# New Quiz Question Type: X-Y Axis Placement

Add a new two-dimensional slider question type to the quiz system where users place a point on a 2D grid, allowing for nuanced personality scoring based on position.

---

## Overview

This adds a fourth question type called **"XY Axis"** (or "Spectrum" / "Position Picker") that presents a 2D plane where:
- The **X-axis** represents one spectrum (e.g., Introvert ↔ Extrovert)
- The **Y-axis** represents another spectrum (e.g., Thinking ↔ Feeling)
- User taps/clicks to place their position on the grid
- Each quadrant/region maps to different character scores

```text
                    Y-axis label (top)
                          ↑
         ┌────────────────┼────────────────┐
         │                │                │
         │   Quadrant 1   │   Quadrant 2   │
         │   (Aaron)      │   (Electra)    │
         │                │                │
X-axis ──┼────────────────●────────────────┼── X-axis
(left)   │                │                │   (right)
         │   Quadrant 3   │   Quadrant 4   │
         │   (Nosferatu)  │   (Madeleine)  │
         │                │                │
         └────────────────┼────────────────┘
                          ↓
                    Y-axis label (bottom)
```

---

## Implementation Details

### 1. Update Type Definitions

**File: `components/quiz/types.ts`**

Add new interfaces for XY Axis questions:

- `XYAxisQuestion` interface with:
  - `id`, `type: 'xy-axis'`, `question`
  - `xAxis: { leftLabel: string, rightLabel: string }`
  - `yAxis: { topLabel: string, bottomLabel: string }`
  - `quadrantScores`: Scoring for each of the 4 quadrants (top-left, top-right, bottom-left, bottom-right)

- Update `QuestionType` union to include `'xy-axis'`
- Update `QuizQuestion` union type
- Update `QuizAnswer` to include `xyPosition?: { x: number, y: number }` (values -1 to 1)

### 2. Create XY Axis Question Component

**File: `components/quiz/XYAxisQuestion.tsx`** (New)

Interactive 2D grid component for quiz-takers:
- Renders a square grid with crosshairs
- Axis labels on all 4 sides
- Touch/click to place a draggable marker
- Visual feedback showing the selected position
- Smooth animations for marker movement
- Accessible with keyboard navigation (arrow keys)

### 3. Create XY Axis Editor Component

**File: `components/quiz/XYAxisEditor.tsx`** (New)

Editor component for the quiz admin:
- Text inputs for all 4 axis labels
- Visual grid preview showing quadrant scoring
- 4 ScoreSlider components (one per quadrant)
- Live preview of how scores interpolate

### 4. Add XY Axis Template

**File: `components/quiz/QuestionTemplates.ts`** (Update)

Add new template:
```
{
  id: 'xy-axis',
  name: 'XY Axis / 2D Spectrum',
  description: 'Place position on 2D grid',
  icon: '📊',
  create: () => ({ ... default XY axis question ... })
}
```

### 5. Update Quiz Editor

**File: `components/quiz/QuizEditor.tsx`** (Update)

- Add "+ XY Axis" button to the "Add New Question" section
- Add `XYAxisEditor` to the `QuestionEditor` component's type switch
- Update `OptionsSummary`-style component for XY questions showing axis labels

### 6. Update Quiz Flow

**File: `components/quiz/QuizFlow.tsx`** (Update)

- Import and render `XYAxisQuestion` for `type === 'xy-axis'`
- Update `handleAnswer` to accept XY position
- Update `calculateResults` to interpolate scores based on X/Y position:
  - Position (-1, 1) = top-left quadrant (100% weight)
  - Position (1, 1) = top-right quadrant (100% weight)
  - Position (0, 0) = center (25% weight to each quadrant)
  - Intermediate positions blend between adjacent quadrants

### 7. Update Question Preview

**File: `components/quiz/QuestionPreview.tsx`** (Update)

Add preview rendering for XY axis questions showing the grid and labels.

---

## Scoring Algorithm

The XY position (x, y) where both values range from -1 to 1:

```text
Position → Quadrant Weights:
┌─────────────────────────────────────┐
│ x < 0, y > 0: Top-Left (TL)         │
│ x > 0, y > 0: Top-Right (TR)        │
│ x < 0, y < 0: Bottom-Left (BL)      │
│ x > 0, y < 0: Bottom-Right (BR)     │
└─────────────────────────────────────┘

Weight calculation:
- TL weight = max(0, -x) * max(0, y)
- TR weight = max(0, x) * max(0, y)  
- BL weight = max(0, -x) * max(0, -y)
- BR weight = max(0, x) * max(0, -y)

Normalize weights and multiply by quadrant character scores.
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `components/quiz/types.ts` | Update | Add XYAxisQuestion type |
| `components/quiz/XYAxisQuestion.tsx` | Create | User-facing 2D grid component |
| `components/quiz/XYAxisEditor.tsx` | Create | Admin editor for XY questions |
| `components/quiz/QuestionTemplates.ts` | Update | Add XY axis template |
| `components/quiz/QuizEditor.tsx` | Update | Add editor support |
| `components/quiz/QuizFlow.tsx` | Update | Add flow support + scoring |
| `components/quiz/QuestionPreview.tsx` | Update | Add preview support |

---

## Visual Design

### Quiz-Taker View
```text
┌─────────────────────────────────────────────┐
│  "Where do you see yourself on this grid?"  │
├─────────────────────────────────────────────┤
│                                             │
│              Spontaneous                    │
│                   ▲                         │
│      ┌────────────┼────────────┐            │
│      │            │            │            │
│      │            │            │            │
│ Solo │────────────●────────────│ Social     │
│      │            │ ← marker   │            │
│      │            │            │            │
│      └────────────┼────────────┘            │
│                   ▼                         │
│               Planned                       │
│                                             │
└─────────────────────────────────────────────┘
```

### Editor View
```text
┌─────────────────────────────────────────────┐
│ XY Axis Labels                              │
├─────────────────────────────────────────────┤
│ Y-Top:    [Spontaneous          ]           │
│ Y-Bottom: [Planned              ]           │
│ X-Left:   [Solo                 ]           │
│ X-Right:  [Social               ]           │
├─────────────────────────────────────────────┤
│ Quadrant Scores                             │
├─────────────────────────────────────────────┤
│ ⬆⬅ Top-Left (Solo + Spontaneous)           │
│ [ScoreSlider: A=2 E=0 M=0 N=0]             │
│                                             │
│ ⬆➡ Top-Right (Social + Spontaneous)        │
│ [ScoreSlider: A=0 E=2 M=0 N=0]             │
│                                             │
│ ⬇⬅ Bottom-Left (Solo + Planned)            │
│ [ScoreSlider: A=0 E=0 M=0 N=2]             │
│                                             │
│ ⬇➡ Bottom-Right (Social + Planned)         │
│ [ScoreSlider: A=0 E=0 M=2 N=0]             │
└─────────────────────────────────────────────┘
```

---

## Accessibility

- Grid navigable via arrow keys
- ARIA live region announces position changes
- Visual marker has sufficient contrast
- Quadrant areas have `role="radiogroup"` semantics
- Labels clearly associated with axes

---

## Technical Notes

**Lock File Reminder:** The project is missing `pnpm-lock.yaml`. Run `pnpm install` locally and commit the lock file for consistent dependency versions.

**Styling:** All new components will use existing design tokens from `design-system/tokens.ts` and maintain the Papyrus font aesthetic.
