# Electron App

A collaborative movie-night application designed for two people. Built with **React**, **TypeScript**, and **Vite**, and styled with a nostalgic **Y2K aesthetic** featuring gel bubbles, dashboard chrome, and iMessage-inspired visuals.

## Overview

Born as an AI Studio prototype in October 2025, this project has evolved into a personal shared environment. It combines a movie watchlist with social layers like message boards, minigames (Food Merge, Spin Wheel), and shared memory walls.

The project emphasizes **nostalgia**, **personality**, and **expressive UI** while maintaining a disciplined storage model using **GitHub Gist** for data persistence.

## 🚀 Quick Start

### Local Development

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Start the development server:**
   ```bash
   pnpm run dev
   ```
   *Starts both the Vite client and the API proxy. Available at http://localhost:5000*

### Main Commands

- `npm run dev`: Start dev server with proxy.
- `npm run build`: Build for production.
- `npm run check-types`: Run TypeScript compiler check.
- `npm test`: Run the test suite.

## 📁 Documentation

For more detailed information, please refer to the following guides in the `docs/` directory:

- [**Deployment Guide**](docs/DEPLOYMENT.md): Detailed instructions for hosting on Vercel, Netlify, and managing environment variables.
- [**Project History**](docs/HISTORY.md): A narrative "Stroll Through Memory Lane" and a chronological log of project milestones and regressions.
- [**Repo Maintenance**](docs/MAINTENANCE.md): The repository simplification plan, consolidation summary, and file count status.

## 🧩 Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Vanilla CSS with custom design tokens for Y2K/Retro-futurist theme.
- **Persistence**: GitHub Gist with a server-side proxy for secure data storage.
- **APIs**: OMDb (movie metadata), Google Places (map components).
- **Backend/Proxy**: Node.js server for handling API requests and Gist authentication.
