# Home Tab Redesign: Mini Preview Interface

The traditional static "Home" tab has been replaced with a dynamic, interactive "Quick Preview" dashboard. This new system prioritizes immediate content discovery and efficient navigation through expandable mini-views.

## 1. Layout Structure & Positioning
- **Centralized Hub**: The Home tab acts as a landing zone with vertical stacking of preview sections.
- **Sectioned Cards**: Each core content area (Movies, Places) is housed in a "MiniPreview" card.
- **Visual Balance**: Sections are clearly separated by spacing and distinct accent colors (Pink for Movies, Blue for Places) to aid in categorical recognition.

## 2. Visual Elements & Styling
- **Glassmorphism**: Cards use semi-transparent backgrounds with backdrop blur to maintain the project's retro-futuristic aesthetic.
- **Accent Borders**: 2px top borders using section-specific colors provide strong visual hierarchy.
- **Iconography**: Integrated `ChevronDown` and `ChevronUp` icons clearly signal expandability.
- **Typography**: Bold headers for sections with sub-text descriptions for guidance.

## 3. Interaction Behavior
- **Tap-to-Expand**: Clicking anywhere on the section header toggles the expanded state using a smooth CSS transition on `max-height` and `opacity`.
- **Accordian Logic**: Users can peek at 2-3 items quickly and collapse when done to keep the interface clean.
- **Direct Navigation**: An "Open Full →" button provides a high-contrast shortcut to the dedicated full-page view of that section.

## 4. Content Strategy
- **Movies Preview**: Displays the top 3 unwatched movies from the shared watchlist, including mini-posters for visual identification.
- **Places Preview**: Shows the top 3 unvisited locations with a distinct left-border accent.
- **Dynamic Empty States**: Informative placeholders appear if a user has no items in their queue, encouraging engagement.

## 5. Technical Implementation
- **Component-Based**: Built using a reusable `MiniPreview` functional component in React.
- **Performance**: Uses `slice(0, 3)` on data arrays to ensure the preview remains lightweight.
- **Animations**: Utilizes `cubic-bezier` transitions for a premium, responsive feel during expansion.
