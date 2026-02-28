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
