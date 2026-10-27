# Dev Server & Initial Load Stabilization Plan

## Overview
The user reported that the website experiences constant dev server disconnects and reconnects immediately upon initial site load. 

### Root Cause Analysis
1. **Vite HMR WebSocket Loop in Cloud Preview Environment**:
   - In `apps/web/vite.config.ts`, HMR is currently evaluated as `hmr: process.env.DISABLE_HMR !== "true"`. In the AI Studio container environment, `DISABLE_HMR` is not set by default, so Vite injects the `@vite/client` runtime which immediately attempts a WebSocket connection to `wss://ais-dev-*.run.app:3000`.
   - The Cloud Run preview ingress proxy does not support raw HMR WebSockets, causing the WebSocket connection to immediately fail with connection resets.
   - When Vite client detects WebSocket loss, it triggers `[vite] server disconnected. polling for restart...` and forces a browser reload (`location.reload()`). On reload, the exact same failure occurs instantly, resulting in an infinite reload and disconnect/reconnect loop on startup.
   - The environment constraints explicitly dictate: *"- HMR: Disabled. Ignore WebSocket errors."*
2. **File Watcher & Container Process Churn**:
   - When Vite's file watcher is active in large monorepos with deep `node_modules`, it consumes file descriptors and CPU, triggering container throttles.
3. **Startup Script & Service Worker Race Conditions**:
   - Startup scripts in `index.html` aggressively unregister service workers and purge caches while assets are actively being fetched, causing transient network aborts during first paint.

---

## User Review Required
> [!NOTE]
> Disabling HMR WebSockets in the development preview container stops the browser from continuously disconnecting and auto-reloading on load. When code changes are made, page updates will refresh reliably without infinite reconnect loops.

---

## Proposed Changes

### 1. Stabilize Vite Dev Server Configuration
#### `apps/web/vite.config.ts`
- Update `server.hmr` to default to `false` in cloud/container preview environments (`hmr: false` or `hmr: process.env.DISABLE_HMR === "false"`), completely eliminating the failing WebSocket reconnection loop.
- Set `server.watch: null` when HMR is disabled to eliminate unnecessary file watcher process churn and CPU spikes.
- Ensure `server.cors: true` and appropriate allowed host configurations (`allowedHosts: true`).
- Ensure port 3000 is strictly bound and `clearScreen: false` remains active.

### 2. Environment Configuration
#### `.env` and `.env.example`
- Add `DISABLE_HMR=true` to guarantee HMR WebSockets are explicitly disabled across all sub-processes and Vite configurations.

### 3. Dev Script Alignment
#### `apps/web/package.json` & `package.json`
- Ensure `apps/web/package.json` `"dev"` script specifies `--port=3000 --host=0.0.0.0` per the Golden Path framework guidelines.
- Confirm root `package.json` calls `npm --prefix apps/web run dev` cleanly without nested loops.

### 4. Startup Module & Asset Loading Resilience
#### `apps/web/src/app/preloadAppModules.ts`
- Wrap initial `/api/session` and `/api/state` warming calls with an explicit abort timeout (e.g. 4000ms) and silent fallback, so any slow container responses or network hiccups never hang the initial paint or trigger error boundaries.

#### `apps/web/index.html`
- Guard the development service worker cleanup so it runs asynchronously after the main application shell has finished mounting (`window.addEventListener('load', ...)`), preventing asset fetch cancellation during first paint.

---

## Verification Plan

### Automated Verification
1. **Compilation Check**: Run `compile_applet` to verify that the Vite configuration and web package compile cleanly with zero errors.
2. **Code Hygiene & Linting**: Run `lint_applet` to ensure zero ESLint warnings or syntax errors.
3. **Test Suite**: Run `npm run test:unit` via `run_command` to verify all 659 unit tests continue passing.

### Manual Verification Walkthrough
1. **Dev Server Restart & Stability**:
   - Restart the dev server with `restart_dev_server`.
   - Open the development app URL (`https://ais-dev-pu3pqujtddceme4x44d6xb-21866646657.us-east1.run.app`).
   - Verify in browser dev tools / console that there are NO repeated `[vite] server disconnected` or WebSocket connection retry loops.
2. **Initial Load Experience**:
   - Refresh the page and confirm the Aaron + Electra loading sequence displays smoothly and transitions to the poster wall without unexpected disconnects, freezes, or reloads.
3. **Interactive Features**:
   - Verify movie posters load, search and filter bars work, and navigation between tabs functions stably.
