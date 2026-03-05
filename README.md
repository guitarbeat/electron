<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Collaborative Movie Watchlist

[![CI](../../actions/workflows/ci.yml/badge.svg)](../../actions/workflows/ci.yml)
[![style: airbnb](https://img.shields.io/badge/style-airbnb-fd5c63.svg?style=flat-square)](https://github.com/airbnb/javascript)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)
[![Ruff](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/astral-sh/ruff/main/assets/badge/v2.json)](https://github.com/astral-sh/ruff)

This repository contains a collaborative movie watchlist application built with React, Vite, and Supabase. It includes features like a movie watchlist, chat, memories, and even a snake game.

View your app in AI Studio: https://ai.studio/apps/drive/1kqFxiDluP0wGmKF3T41vjNvhUfIOBMiI

## Features

- **Watchlist**: Manage a collaborative list of movies using GitHub Gists.
- **Chat & Message Board**: Real-time communication for collaborators.
- **Memories**: Capture and share notes and memories.
- **Minigames**: Includes built-in Snake, Food Drop, and Quiz games.
- **Places**: Integrated map and places list.

## Architecture

### High-level flow

```mermaid
flowchart TD
  A["index.tsx"] --> B["UserProvider + ToastProvider"]
  B --> C["App.tsx (AppInner)"]
  C --> D["ThemeProvider + BubbleDismissProvider"]
  D --> E["AppHeader / TabBar"]
  D --> F["Main tab panels"]
  F --> G["Watchlist (Movies tab)"]
  F --> H["PlacesList (Places tab)"]
  D --> I["BubbleLayer + Quiz/Matchmaker bubbles"]
  D --> J["MinigameModal + QuizEditor"]
  C --> K["hooks/useAudio + hooks/useQuiz"]
```

### Key directories

- `components/layout`: Header and top-level layout primitives.
- `components/ui`: Shared UI pieces (TabBar, inputs, modal wrappers).
- `components/watchlist`: Movie queue and watchlist-specific UI.
- `components/places`: Places tab UI and related interactions.
- `components/bubbles`: Floating bubble layer and interactive bubbles.
- `components/extras`, `components/snake`, `components/food-drop`: Minigame features.
- `context`: Cross-cutting app state (`UserContext`, `ThemeContext`, toast, bubble dismissal).
- `hooks`: Behavioral units (`useAudio`, `useQuiz`, and feature hooks).
- `styles`: Shared global utilities and cross-feature visual tokens.

### State and theming model

- `App.tsx` owns `activeTab`, quiz completion state, and quiz editor modal visibility.
- `ThemeProvider` receives `activeTab` and drives tab-aware theme tokens.
- `body[data-theme]` is switched between `movies` and `places` to update CSS variables.
- Visual direction uses a metallic base gradient with Y2K accent glints (pink/cyan for Movies, yellow/green for Places).

## Run Locally

**Prerequisites:** Node.js (v18+ recommended)

1. **Clone the repository:**

   ```bash
   git clone https://github.com/guitarbeat/electron.git
   cd electron
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env.local` and fill in the required values:

   ```bash
   cp .env.example .env.local
   ```

   - `VITE_GIST_ID`: Your GitHub Gist ID.
   - `VITE_GIST_TOKEN`: Your GitHub Personal Access Token with `gist` scope.
   - `VITE_OMDB_API_KEY`: (Optional) For movie metadata.
   - `VITE_GOOGLE_PLACES_API_KEY`: (Optional) For place autocomplete.

4. **Run the app:**
   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev`: Start the development server.
- `npm run build`: Build the project for production.
- `npm run lint`: Run ESLint to check for code style issues.
- `npm run format`: Format the code using Prettier.
- `npm run test:all`: Run all tests.

## Tech Stack

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS
- **Backend/Database**: Supabase
- **Storage**: GitHub Gists (for watchlist data)
- **Deployment**: Vercel / AI Studio
