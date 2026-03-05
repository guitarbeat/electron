# Collaborative Movie Watchlist

A React-based collaborative movie watchlist and date-night planner web application.

## Features

- **Movie Watchlist Management:** Add, track, and manage movies you want to watch together. Powered by GitHub Gists for storage.
- **Daily Spin / Recommendation:** Can't decide what to watch? Let the daily spin feature pick for you!
- **Snake Minigame:** A built-in classic Snake game to pass the time (`components/snake/`).
- **Memories:** Turn completed films into shared memories (`components/memories/`).
- **Quiz Feature:** A fun quiz service (`services/quizService.ts`).
- **Date Spots (Places Tab):** Plan your next date spot alongside your movie nights.
- **Secure Access:** Built-in PIN-based security configuration (`config/security.ts`).

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Physics Engine:** Matter.js (used for interactive UI/game elements)
- **Backend/Auth:** Supabase
- **Storage:** GitHub Gists (JSON-based state storage)
- **Deployment:** Vercel

## Getting Started

Follow these steps to set up the project locally.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [pnpm](https://pnpm.io/) (used in this project, though npm works)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd collaborative-movie-watchlist
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and fill in the required values (see [Environment Variables](#environment-variables)).

4. Start the development server:
   ```bash
   pnpm run dev
   ```

## Available Scripts

In the project directory, you can run:

- `pnpm run dev`: Starts the Vite development server.
- `pnpm run build`: Builds the app for production.
- `pnpm run preview`: Locally preview the production build.
- `pnpm run lint`: Runs ESLint to check for code issues.
- `pnpm run format`: Runs Prettier to format the codebase.
- `pnpm run check-types`: Runs TypeScript compiler check without emitting files.
- `pnpm run test:all`: Runs the entire test suite.
- `pnpm run test:snake`: Runs tests specifically for the Snake game logic.
- `pnpm run test:memories`: Runs tests for memory utilities and auth.
- `pnpm run test:security`: Runs tests for security configuration.
- `pnpm run test:quiz`: Runs tests for the quiz service.

## Environment Variables

The application requires certain environment variables to function correctly. Reference `.env.example` for the current list.

- `VITE_GIST_ID` **(Required)**: The ID of the GitHub Gist used to store the watchlist data (`movielist.json`).
- `VITE_GIST_TOKEN` **(Required)**: A GitHub Personal Access Token with the `gist` scope to read/write the Gist.
- `VITE_SUPABASE_URL` **(Required)**: Your Supabase project URL.
- `VITE_SUPABASE_PUBLISHABLE_KEY` **(Required)**: Your Supabase anon/publishable key.
- `VITE_OMDB_API_KEY` *(Optional)*: OMDB API key for fetching movie metadata.
- `VITE_GOOGLE_PLACES_API_KEY` *(Optional)*: Google Places API key for place name autocomplete on the Places tab.

## Project Structure

- `components/`: Contains all React components, organized by feature (e.g., `watchlist/`, `snake/`, `memories/`, `places/`, `ui/`, `common/`).
- `services/`: API and external service integrations (`gistClient.ts`, `movieService.ts`, `quizService.ts`, etc.).
- `config/`: Configuration files (e.g., `security.ts`, `gistConfig.ts`).
- `context/`: React context providers for global state (User, Theme, etc.).
- `design-system/`: Design tokens and UI primitives.
- `hooks/`: Custom React hooks (`useWatchlist.ts`, `useAudio.ts`, `useQuiz.ts`).
- `supabase/`: Supabase specific configuration and edge functions.
- `types.ts`: Shared TypeScript interfaces and types.
