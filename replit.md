# Collaborative Movie Watchlist

## Overview
A React-based collaborative movie watchlist application built with Vite and TypeScript. This is an AI Studio app that uses the Gemini API for AI features.

## Project Architecture
- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite 6.4
- **Package Manager**: pnpm

### Directory Structure
- `components/` - React components (quiz, etc.)
- `hooks/` - Custom React hooks (useMessages, useMovies, usePins, etc.)
- `services/` - API services (geminiService, movieService, etc.)
- `config/` - Configuration files
- `context/` - React context providers
- `design-system/` - Design tokens and styling
- `public/` - Static assets

## Development Setup
- Dev server runs on port 5000 (configured in vite.config.ts)
- Host is set to 0.0.0.0 for Replit compatibility
- All hosts are allowed for proxy access

## Environment Variables
- `GEMINI_API_KEY` - Required for AI/Gemini features

## Running the Application
```bash
pnpm install
pnpm run dev
```

## Deployment
- Build command: `pnpm build`
- Output directory: `dist`
- Deployment type: Static

## Recent Changes
- 2026-01-26: Initial Replit setup - configured Vite for port 5000 with allowedHosts
