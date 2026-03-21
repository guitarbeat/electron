# Deployment & Development Guide

This document covers how to run the project locally and deploy it to production environments.

## 🚀 Quick Start (Local Development)

The project uses `pnpm` for package management and a Node.js proxy server for API requests.

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Start the development server:**
   ```bash
   pnpm run dev
   ```
   *Starts both the Vite client and the API proxy. Available at http://localhost:5000*

3. **Check Types & Build:**
   ```bash
   npm run check-types
   npm run build
   ```

---

## 🏗️ Deployment Status

The project is configured for successful production builds. Key requirements for `/api` endpoints:
- `src/services/gistClient.ts` uses `GIST_API_URL` for shared data persistence.
- `src/services/metadataService.ts` uses `OMDB_BASE` for movie metadata lookups.

In development, these are proxied via `vite.config.ts` to `http://localhost:3001`.

## 🌐 Deployment Options

### 1. Full App Parity (Recommended)
- Deploy serverless handlers for `/api/gist` and `/api/omdb`.
- **Vercel**: Configured via `api/gist.ts` and `api/omdb.ts` (proxies).
- **Netlify**: Configured via `netlify.toml` for API rewrites.

### 2. Static Hosting Only
- Omit `VITE_GIST_ID` to use `localStorage` fallback.
- Set `VITE_GIST_API_URL` and `VITE_OMDB_API_URL` only if your host exposes compatible endpoints.

---

## 🔑 Environment Variables

### Variables for App Behavior
- `VITE_GIST_ID`: Enables remote shared storage. (Fallback: `localStorage`)
- `VITE_GIST_API_URL`: Override default `/api/gist`.
- `VITE_OMDB_API_URL`: Override default `/api/omdb`.
- `VITE_OMDB_API_KEY`: API key for direct OMDb calls.
- `VITE_GOOGLE_PLACES_API_KEY`: Required for map features.

### Variables for Serverless Proxy (e.g., Vercel)
- `GIST_ID`: Server-side ID for the gist.
- `GITHUB_TOKEN`: Auth token for Gist API writes.
- `API_SECRET`: Server-side secret used to authorize client write requests. Must match `VITE_API_SECRET`.
- `SESSION_SIGNING_SECRET`: Required for profile session cookies and PIN-protected profile auth.
- `OMDB_API_URL`: Server-side base URL for OMDb proxy.
- `OMDB_API_KEY`: Server-side API key for OMDb.

---

## 🛠️ Host-Specific Setup

- **Vercel**: `vercel.json` ensures SPA fallback (`/index.html`).
- **Netlify**: `netlify.toml` handles API proxying and SPA routing.
