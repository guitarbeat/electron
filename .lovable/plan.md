
# Vastly Improved Survey/Quiz Editor

A comprehensive overhaul of the quiz editor to make it significantly more intuitive, powerful, and user-friendly while preserving the Papyrus font aesthetic.

---

## Current Pain Points Identified

After analyzing the existing `QuizEditor.tsx` (948 lines), I've identified these limitations:

1. **No Drag-and-Drop Reordering** - Questions can't be reordered visually
2. **No Question Preview** - Can't see how questions will appear to users
3. **Limited Score Visualization** - Just number inputs, hard to see scoring at a glance
4. **No Bulk Operations** - Can't duplicate, import/export, or batch edit
5. **No Undo/Redo** - Accidental changes require manual reverting
6. **No Question Templates** - Have to build each question from scratch
7. **Clunky Score Editor** - 4 separate number inputs per option is tedious
8. **No Visual Feedback** - No confirmation when changes are made
9. **Limited Mobile Experience** - Editor is cramped on small screens

---

## Proposed Improvements

### 1. Drag-and-Drop Question Reordering

Add visual drag handles and reorder capability for questions.

**File: `components/quiz/QuizEditor.tsx` (update)**
- Add drag handle icons (grip dots) to question cards
- Implement drag-and-drop using native HTML5 drag events
- Show visual drop indicator between questions
- Update question order on drop

### 2. Live Question Preview Panel

Split-pane view with editor on left and live preview on right.

**File: `components/quiz/QuizEditor.tsx` (update)**
- Add "Preview" toggle button in header
- When editing a question, show how it renders in real-time
- Use actual question components (`MultipleChoiceQuestion`, etc.)
- Preview updates as user types

### 3. Enhanced Score Editor with Visual Sliders

Replace 4 number inputs with visual slider bars.

**File: `components/quiz/QuizEditor.tsx` (update ScoreEditor)**
- Replace number inputs with horizontal slider bars (0-5)
- Show character icon/initial next to each slider
- Color-coded bars (different color per character)
- Quick "Clear All" and "Max" buttons per option
- Show total score for each option as badge

### 4. Question Templates

One-click templates for common question patterns.

**File: `components/quiz/QuizEditor.tsx` (update)**
- Add "Use Template" dropdown when creating new question
- Templates:
  - "Personality Preference" (4 options, pre-balanced scores)
  - "Agree/Disagree Statement" (pre-set score distribution)
  - "Image Grid" (4 images, one per character)
  - "Blank" (current behavior)

### 5. Duplicate Question Feature

Quick clone of existing questions.

**File: `components/quiz/QuizEditor.tsx` (update QuestionsTab)**
- Add duplicate button (📋) next to delete button
- Creates copy with "(copy)" appended to question text
- New question placed immediately after original

### 6. Bulk Score Distribution Shortcuts

Quick ways to assign scores without manual entry.

**File: `components/quiz/QuizEditor.tsx` (update ScoreEditor)**
- "Assign to [Character]" dropdown for each option
- Quick buttons: "Strong Match (2)", "Partial Match (1)", "No Match (0)"
- "Balance Evenly" auto-distributes scores across options

### 7. Question Collapse/Expand All

Better overview when editing many questions.

**File: `components/quiz/QuizEditor.tsx` (update QuestionsTab)**
- "Expand All" / "Collapse All" buttons in header
- Click question to expand/collapse inline (without separate edit view)
- Show mini preview of options when collapsed

### 8. Undo/Redo for Local Changes

Track changes before saving.

**File: `components/quiz/QuizEditor.tsx` (update)**
- Add undo (↩) and redo (↪) buttons in header
- Track history of local changes (max 20 states)
- Keyboard shortcuts: Ctrl+Z, Ctrl+Y

### 9. Import/Export Quiz Data

Backup and share quiz configurations.

**File: `components/quiz/QuizEditor.tsx` (update)**
- Add "Export" button → downloads quiz as JSON
- Add "Import" button → file picker for JSON
- Validate imported data structure before applying

### 10. Mobile-Optimized Editor Layout

Better editing experience on phones/tablets.

**File: `components/quiz/QuizEditor.tsx` (update)**
- Stack panels vertically on mobile
- Larger touch targets for score sliders
- Bottom sheet for question type selection
- Swipe gestures for question navigation

---

## Detailed Technical Specification

### File Changes

| File | Action | Description |
|------|--------|-------------|
| `components/quiz/QuizEditor.tsx` | Major Update | Core editor improvements |
| `components/quiz/ScoreSlider.tsx` | New | Visual score slider component |
| `components/quiz/QuestionPreview.tsx` | New | Live preview panel component |
| `components/quiz/QuestionTemplates.ts` | New | Pre-defined question templates |
| `hooks/useUndoRedo.ts` | New | Generic undo/redo hook |

### New Component: ScoreSlider

```text
┌──────────────────────────────────────────┐
│ Aaron       ●────────────○     [2]       │
│ Electra     ●○                 [0]       │
│ Madeleine   ●────○             [1]       │
│ Nosferatu   ●──────────────────○ [5]     │
└──────────────────────────────────────────┘
  [ Clear All ]  [ Even Distribution ]
```

### New Component: QuestionPreview

Renders the actual question component in a scaled preview frame:
- 60% scale preview card
- Shows exactly how users will see the question
- Updates in real-time as editor changes
- Toggle between desktop and mobile preview sizes

### Drag-and-Drop Implementation

Using native HTML5 Drag and Drop API:
- `draggable="true"` on question cards
- `onDragStart`, `onDragOver`, `onDrop` handlers
- CSS visual feedback during drag
- Reorder array on drop

### Undo/Redo Hook

```typescript
interface UseUndoRedo<T> {
  state: T;
  setState: (newState: T) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clear: () => void;
}
```

---

## UI/UX Improvements Visual

### Before: Question List View
```text
┌─────────────────────────────────────────────────┐
│ #1 MULTIPLE CHOICE                              │
│ What's your ideal Friday night?            [✕]  │
└─────────────────────────────────────────────────┘
```

### After: Enhanced Question List View
```text
┌─────────────────────────────────────────────────┐
│ ⋮⋮ #1 MULTIPLE CHOICE                   📋 ⬆⬇ ✕ │
│    What's your ideal Friday night?              │
│    ├─ Watching movies at home (A:2 E:1)        │
│    ├─ Going out to a party (M:2 N:1)           │
│    ├─ Reading a book alone (A:1 N:2)           │
│    └─ Hanging with close friends (E:2 M:1)     │
│                                                 │
│    [ Edit Question ]  [ Preview ]               │
└─────────────────────────────────────────────────┘
```

### Score Editor Transformation

**Before:**
```text
┌───────────────────┬───────────────────┐
│ AARON        [0]  │ ELECTRA      [2]  │
├───────────────────┼───────────────────┤
│ MADELEINE    [1]  │ NOSFERATU    [0]  │
└───────────────────┴───────────────────┘
```

**After:**
```text
┌─────────────────────────────────────────────────┐
│ Quick Assign: [ Aaron ▼ ]  [ Strong Match ]     │
├─────────────────────────────────────────────────┤
│ 👤 Aaron      [──●────────────]  2              │
│ 👤 Electra    [────────────●──]  4              │
│ 👤 Madeleine  [──●────────────]  2              │
│ 👤 Nosferatu  [●──────────────]  0              │
├─────────────────────────────────────────────────┤
│ Total: 8 points    [ Clear ] [ Balance ]        │
└─────────────────────────────────────────────────┘
```

---

## Implementation Priority

| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| 1 | Visual Score Sliders | 30 min | High |
| 2 | Duplicate Question | 10 min | High |
| 3 | Inline Expand/Collapse | 25 min | High |
| 4 | Drag-and-Drop Reorder | 35 min | Medium |
| 5 | Live Question Preview | 30 min | Medium |
| 6 | Question Templates | 20 min | Medium |
| 7 | Import/Export | 20 min | Medium |
| 8 | Undo/Redo | 25 min | Medium |
| 9 | Quick Score Assign | 15 min | Medium |
| 10 | Mobile Optimization | 30 min | Medium |

---

## Accessibility Considerations

- All sliders have proper `aria-label` and `aria-valuetext`
- Drag-and-drop has keyboard alternative (move up/down buttons)
- Focus management when expanding/collapsing questions
- Screen reader announcements for reorder operations
- Preserve existing ARIA patterns from current implementation

---

## Technical Notes

**Font Preservation:** All new UI elements will use Papyrus via design tokens:
```typescript
fontFamily: typography.fontFamily.heading // ['Papyrus', 'fantasy']
```

**Lock File Reminder:** The project is missing a lock file. You should run `pnpm install` locally and commit `pnpm-lock.yaml` for consistent dependency versions.

**No External Dependencies:** All features implemented with native React and HTML5 APIs (no external drag-and-drop libraries needed).

