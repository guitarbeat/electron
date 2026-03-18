# Project Guidelines

## Project Overview

A collaborative movie-night application designed for two people. Built with **React**, **TypeScript**, and **Vite**, and styled with a nostalgic **Y2K aesthetic** featuring gel bubbles, dashboard chrome, and iMessage-inspired visuals.

The project emphasizes **nostalgia**, **personality**, and **expressive UI** while maintaining a disciplined storage model using **localStorage** by default (with optional GitHub Gist sync for multi-device persistence).

## Project Structure

- `src/components/`: UI components organized by feature (common, effects, food-merge, matchmaker, memories, places, quiz, ui, watchlist).
- `src/hooks/`: Custom React hooks for various functionalities.
- `src/services/`: Service layer for external APIs (Gist, OMDb) and data management (memory, movies, polling).
- `src/utils.ts`: Consolidated utilities (security, validation, concurrency).
- `src/context.tsx`: Consolidated context providers (User, Theme, Toast).
- `api/`: Node.js server/proxy for handling OMDb and Gist API requests.
- `docs/`: Documentation for deployment, history, and maintenance.

## Tech Stack

- **Frontend**: React 18+, TypeScript, Vite
- **Styling**: Vanilla CSS with custom design tokens for Y2K/Retro-futurist theme.
- **Persistence**: localStorage by default, with optional GitHub Gist sync for shared/multi-device storage.
- **APIs**: OMDb (movie metadata), Google Places (map components).
- **Backend/Proxy**: Node.js server/proxy (using Vite's SSR loader for API handlers).

## Development Workflow

- **Start Development Server**: `npm run dev` (Starts Vite client and API proxy on port 5000).
- **Production Build**: `npm run build`
- **Type Check**: `npm run check-types`
- **Linting**: `npm run lint`
- **Running Tests**: `npm test` (Uses Node.js's built-in test runner via wildcard glob).

## Code Style & Best Practices

- **Consolidation First**: Prefer adding functionality to existing feature files over creating new micro-files.
- **File Count Management**: Maintain a lean codebase; avoid file count explosion. Target is ~100 files in `src/`.
- **Feature Encapsulation**: Keep feature-specific code (components, hooks, logic) inside the feature's folder.
- **Shared Code**: Code moves to `src/utils.ts` or `src/context.tsx` only if it has at least 2 feature consumers.
- **Centralized Styling**: Prefer using/extending styles in `App.css` to keep the UI consistent.
- **Y2K Aesthetic**: Follow the established design language: gel bubbles, chrome textures, and nostalgic 2000s web/UI elements.
