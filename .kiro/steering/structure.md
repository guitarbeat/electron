# Project Structure

## Root Layout

```
/
├── src/                    # Main application source
├── server/                 # Express API proxy server
├── public/                 # Static assets (quiz photos)
├── scripts/                # Build and dev scripts
├── .kiro/                  # Kiro configuration (steering, hooks)
├── App.tsx                 # Root application component
└── index.html              # Entry HTML
```

## Source Organization (`src/`)

### Components (`src/components/`)

Feature-based component organization:

- **`common/`** - Shared UI components (GelBubbleAvatar, PinDialog, UserSelection, icons)
- **`ui/`** - Base UI primitives (Button, Card, Input, Modal, Toast, BottomSheet)
- **`watchlist/`** - Movie/show queue feature
- **`places/`** - Location planning feature
- **`quiz/`** - Quiz system with editor and flow
- **`matchmaker/`** - Swipe-based decision making
- **`memories/`** - Memory/photo collection
- **`food-merge/`** - Food merge mini-game
- **`extras/`** - Additional mini-games (SpinWheel)
- **`effects/`** - Visual effects (Confetti)

### Core Directories

- **`hooks/`** - Custom React hooks (useQuiz, useMovies, usePlaces, usePolling, etc.)
- **`context/`** - React context providers (User, Theme, Toast)
- **`services/`** - Business logic and API clients (gistClient, memoryService, metadataService, PollingManager)
- **`utils/`** - Utility functions
- **`styles/`** - Global CSS
- **`design-system/`** - Design tokens

## Component Patterns

### Feature Components
Each major feature has its own directory with:
- Main component file
- Sub-components (if complex)
- Feature-specific hooks (in `hooks/` subfolder)
- Feature-specific styles (CSS files co-located)
- Types (either inline or in `types.ts`)

Example: `watchlist/`
```
watchlist/
├── index.tsx                    # Main Watchlist component
├── Watchlist.css               # Feature styles
├── components/                 # Sub-components
│   ├── MovieCard.tsx
│   └── controls/
│       └── WatchlistTopControls.tsx
└── hooks/
    └── useWatchlist.ts         # Feature hook
```

### UI Components
Base components in `ui/` are reusable primitives with minimal business logic.

## Import Conventions

Use path aliases for cleaner imports:
```typescript
import { Button } from '@/ui/Button';
import { useQuiz } from '@/hooks/useQuiz';
import { gistClient } from '@/services/gistClient';
```

## State Management

- **Context API** for global state (user, theme, toast)
- **Local state** with useState/useReducer for component state
- **Custom hooks** for feature-specific state logic
- **Services** for data fetching and external API calls

## Styling Approach

- **CSS files** co-located with components
- **Global styles** in `src/styles/global.css`
- **Component styles** in `App.css` and feature-specific CSS files
- **Design tokens** in `src/design-system/tokens.ts`
- **Theme switching** via data attributes (`data-theme="movies"` or `data-theme="places"`)

## Server Structure

```
server/
└── index.js    # Express server for OMDb API proxy
```

Simple proxy server that forwards `/api` requests to external services.
