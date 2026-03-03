# Collaborative Movie Watchlist

A collaborative web app for friends/family to manage a shared movie watchlist, message board, minigames, quizzes, and a shared map.

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **Package Manager**: pnpm
- **Backend/DB**: Supabase (real-time messaging, user management)
- **Storage**: GitHub Gists (movie watchlist data)
- **APIs**: OMDB (movie metadata), Google Places, Gemini AI (via Supabase Edge Functions)

## Project Structure

- `components/` — Feature-based React components (watchlist, message-board, quiz, snake, memories, etc.)
- `services/` — Business logic and API interaction layers
- `hooks/` — Custom React hooks
- `context/` — Global state (UserContext)
- `config/` — Configuration for Supabase, GitHub Gist, Google Places
- `integrations/` — Supabase client config
- `supabase/` — Supabase config and Edge Functions
- `design-system/` — Theme tokens (colors, spacing, typography)

## Environment Variables Required

- `VITE_GIST_TOKEN` — GitHub personal access token with "gist" scope
- `VITE_GIST_ID` — GitHub Gist ID for movie data storage
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon/public key
- `VITE_OMDB_API_KEY` — OMDB API key for movie metadata
- `VITE_GOOGLE_PLACES_API_KEY` — Google Places API key

## Development

```bash
pnpm install
pnpm run dev   # Starts on port 5000
```

## Deployment

Configured as a static site:

- Build: `pnpm run build`
- Public dir: `dist`
# Home Tab Redesign: Mini Preview Interface

The traditional static "Home" tab has been replaced with a dynamic, interactive "Quick Preview" dashboard. This new system prioritizes immediate content discovery and efficient navigation through expandable mini-views.

## 1. Layout Structure & Positioning
- **Centralized Hub**: The Home tab acts as a landing zone with vertical stacking of preview sections.
- **Sectioned Cards**: Each core content area (Movies, Places) is housed in a "MiniPreview" card.
- **Visual Balance**: Sections are clearly separated by spacing and distinct accent colors (Pink for Movies, Blue for Places) to aid in categorical recognition.

## 2. Visual Elements & Styling
- **Glassmorphism**: Cards use semi-transparent backgrounds with backdrop blur to maintain the project's retro-futuristic aesthetic.
- **Avatar-Inspired Background**: Replaced the static dark background with a deep space gradient featuring floating bioluminescent orbs and a subtle star-grid particle system.
- **Bioluminescent Accents**: Integrated "screen" blend modes and blur filters to create a natural, glowing atmosphere.

## 3. Interaction Behavior
- **Tap-to-Expand**: Clicking anywhere on the section header toggles the expanded state using a smooth CSS transition on `max-height` and `opacity`.
- **Bubble Navigation**: The navigation bar now features rounded, tactile "bubble" buttons with interactive pop animations and lifted hover states.
- **Direct Navigation**: An "Open Full →" button provides a high-contrast shortcut to the dedicated full-page view of that section.

## 4. Content Strategy
- **Movies Preview**: Displays the top 3 unwatched movies from the shared watchlist, including mini-posters for visual identification.
- **Places Preview**: Shows the top 3 unvisited locations with a distinct left-border accent.
- **Dynamic Empty States**: Informative placeholders appear if a user has no items in their queue, encouraging engagement.

## 5. Technical Implementation
- **Component-Based**: Built using a reusable `MiniPreview` functional component in React.
- **Performance**: Uses `slice(0, 3)` on data arrays to ensure the preview remains lightweight.
- **Animations**: Utilizes `cubic-bezier` transitions for a premium, responsive feel during expansion.
