# Watchlist Component Architecture

## Overview
The watchlist component has been restructured to improve maintainability and separation of concerns.

## Directory Structure

```
src/components/watchlist/
├── hooks/
│   ├── data/                 # Data layer hooks
│   │   ├── useMovies.ts      # Movie data management
│   │   ├── useSuggestions.ts # Suggestion data management  
│   │   ├── useMemories.ts    # Memory data management
│   │   └── index.ts          # Consolidated exports
│   └── useWatchlist.ts       # Main orchestration hook
├── components/
│   ├── controls/             # UI control components
│   │   ├── WatchlistControlsPane.tsx
│   │   ├── WatchlistPrimaryFilters.tsx
│   │   ├── WatchlistTopControls.tsx
│   │   └── index.ts
│   ├── ui/                   # Reusable UI components
│   │   ├── RotaryDialCarousel.tsx
│   │   ├── RotaryDialCarousel.css
│   │   └── index.ts
│   └── WatchlistMoreMenu.tsx
├── index.tsx                 # Main watchlist component
├── types.ts                  # Type definitions
├── utils.ts                  # Utility functions
└── utils.test.ts            # Tests
```

## Key Improvements

### 1. Data Layer Consolidation
- Moved `useMovies`, `useSuggestions`, and `useMemories` hooks into a dedicated `data/` subdirectory
- Created unified exports through `index.ts` for cleaner imports
- Better separation between data fetching and UI logic

### 2. Component Organization
- **Controls/**: All user input and filtering components
- **UI/**: Reusable visual components like carousels
- Logical grouping makes it easier to find related components

### 3. Improved Import Structure
```typescript
// Before
import { useMovies } from '../../../hooks/useMovies';
import { useSuggestions } from '../../../hooks/useSuggestions';
import { useMemories } from '../../../hooks/useMemories';

// After  
import { useMovies, useSuggestions, useMemories } from './data';
```

## Data Flow

1. **useWatchlist** - Main orchestration hook that coordinates all data
2. **Data Hooks** - Individual hooks for movies, suggestions, and memories
3. **UI Components** - Consume data through useWatchlist hook
4. **Service Layer** - Handles API calls and persistence

## Benefits

- **Better Maintainability**: Related files are co-located
- **Clearer Separation**: Data, UI, and business logic are separated
- **Easier Testing**: Smaller, focused modules are easier to test
- **Reduced Imports**: Consolidated exports reduce import complexity
