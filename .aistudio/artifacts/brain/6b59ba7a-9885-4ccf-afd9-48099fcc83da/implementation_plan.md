# Aggressive React Singleton Resolution, Fast-Load Optimization & Cross-Browser Compatibility Plan

Eliminates the `Invalid hook call` / `resolveDispatcher().useState` crash in `<AppProviders>` by enforcing a strict single-instance React 19 resolution across the monorepo, wraps the root render in `<GlobalErrorBoundary>`, accelerates initial page load and bundle execution, and hardens cross-browser/device compatibility across iOS Safari, Android PWAs, desktop browsers, and Fire TV / Silk.

## User Review & Critical Decisions

> [!IMPORTANT]
> This revised plan incorporates your request to make the site load faster and be more compatible across browsers and devices, alongside aggressive single-instance React resolution and root error boundary recovery.

- **Confirmed Decision 1 (Aggressive Single-Instance React Resolution)**: Lock `react` and `react-dom` to a single canonical physical instance via Vite alias/dedupe rules, package manager `overrides`, forced Vite dependency optimization (`force: true`), and moving runtime libraries (`react`, `react-dom`, `@tanstack/react-query`, `@radix-ui/react-alert-dialog`, `motion`, `lucide-react`, `clsx`, `tailwind-merge`, `zod`) from `devDependencies` into `dependencies`.
- **Confirmed Decision 2 (Top-Level GlobalErrorBoundary & Deduplication)**: Wrap the root `<App />` tree in `<GlobalErrorBoundary>` and deduplicate the redundant `GlobalErrorBoundary` class definition inside `AppWorkspaceShell` so the shell imports the single canonical boundary module.
- **Confirmed Decision 3 (Load Speed & Bundle Performance)**:
  - **Non-Blocking Fonts & Preload**: Make Google Fonts stylesheet loading non-render-blocking (`media="print"` swap pattern with `<noscript>` fallback) and eliminate duplicate font stylesheet injection in `loadFeatureFonts()` when fonts are already present in `index.html`.
  - **Parallel API & Module Pre-Warming**: Warm `/api/session` and `/api/state/movies` in parallel with `preloadCriticalAppModules()` at boot so data and code chunks arrive simultaneously instead of sequentially waterfalling after React mounts.
  - **Smart Vendor Chunk Splitting**: Configure Rollup `manualChunks` in Vite to isolate `react-vendor` (`react`, `react-dom`), `query-vendor` (`@tanstack/react-query`), `motion-vendor` (`gsap`, `motion`), and `ui-vendor` (`lucide-react`, `@radix-ui/react-alert-dialog`) for optimal parallel HTTP/2 loading and long-term browser caching.
  - **ObjectURL Memory Leak Prevention**: Revoke created `URL.createObjectURL(blob)` instances on unmount/change in `useResilientImage` and attach `referrerPolicy="no-referrer"` to `ResilientImage` so external movie posters load reliably without hotlink blocks.
- **Confirmed Decision 4 (Broad Browser & Device Compatibility)**:
  - **Safe `matchMedia` & Event Listener Fallback**: Add a universal helper supporting both modern `addEventListener("change", ...)` and legacy Safari/WebView/SmartTV `addListener(...)` across `useMediaQuery`, `ViewportProvider`, `useCardTilt`, and `main.tsx`.
  - **Resilient Storage & Private Browsing Guards**: Wrap all direct `window.localStorage` reads/writes in `main.tsx` and `App.tsx` with `try/catch` guards so Safari Private Browsing, strict iFrame sandboxes, or quota-exceeded states never crash startup.
  - **CSS & Viewport Compatibility**: Provide a `100vh` fallback before `100dvh` in critical inline styles and lower the Vite build target from `es2022` to `es2020` for broader compatibility with older Smart TVs (Fire TV Silk, Tizen, WebOS) and older iPads/iphones.

---

## 1. Overview & Core Concept

- **What It Does**: Restores immediate startup stability to the Electron (Aaron & Electra) media workspace, eliminates duplicate React instances, speeds up First Contentful Paint (FCP) and Time to Interactive (TTI) through parallel data/chunk warming and non-blocking assets, and ensures rock-solid compatibility across desktop browsers, mobile PWAs, iFrame sandboxes, and TV browsers.
- **Target Audience / Persona**: Aaron and Electra using the shared movies, places, quiz, and matchmaker workspace across desktop, mobile iOS/Android PWA, and living-room TV browsers.
- **Key Value**: Eradicates the blank screen crash on boot, eliminates render-blocking font waterfalls and sequential API waterfalls, prevents memory leaks from cached poster blobs, and guarantees graceful fallbacks on older or privacy-restricted browsers.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Instant Non-Blocking Boot Flow**: The browser immediately paints the dark obsidian canvas (`#07091a`) and spinner without waiting on external Google Font stylesheets. In parallel, `/api/session`, `/api/state/movies`, and the workspace shell chunks pre-warm together.
  2. **Zero-Crash Workspace Initialization**: `<GlobalErrorBoundary>` mounts at the root above `<AppProviders>`. All context providers (`QueryClientProvider`, `UserProvider`, `ProfilePinProvider`, `ToastProvider`, `PwaInstallProvider`, `ViewportProvider`, `ThemeProvider`) bind to the single canonical React 19 dispatcher.
  3. **Resilient Poster & Media Rendering**: Movie and place cards render with `referrerPolicy="no-referrer"`, `decoding="async"`, and clean `ObjectURL` lifecycle management, falling back seamlessly to cached blobs or the editorial placeholder graphic if offline.
  4. **Graceful Root Recovery Flow**: If an unexpected runtime fault ever occurs inside a top-level provider or during workspace boot, `<GlobalErrorBoundary>` intercepts the error and renders the Y2K diagnostic recovery window (**Copy Dump**, **Reboot Module**, **Restart App**).
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Preserves the signature Y2K cyber-retro and dark cinema aesthetic (`movies` / `places` themes) with CRT power-on entrance animation, rounded viewport frame, and vignette lighting.
  - *Color Palette & Mood*: Deep obsidian canvas (`#050814` / `--bg-main`) with high-contrast cyan (`#00f0ff`) and crimson (`#ff0055`) diagnostic accents in the error recovery shell.
  - *Typography & Hierarchy*: Clean sans-serif display/body hierarchy (`Plus Jakarta Sans`, `Outfit`, `Syne`) paired with `JetBrains Mono` tabular numerals (`tabular-nums`), loaded asynchronously with `display=swap` to prevent invisible text delays.
- **Interactive Feedback & Motion**:
  - Preserves the GSAP CRT entrance animation (`useCrtEntranceAnimation`) and respects `prefers-reduced-motion: reduce`.
  - Eliminates synchronous DOM class mutations inside `useMemo` in `ViewportProvider` by moving them to `useEffect`, preventing React 19 StrictMode double-render glitches.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Hard Aliasing + Deduplication of All React Entrypoints in Vite**
  - *Chosen Approach*: Explicitly map `react`, `react-dom`, `react-dom/client`, `react/jsx-runtime`, and `react/jsx-dev-runtime` in Vite `resolve.alias` to the single canonical React package directory, expand `resolve.dedupe`, and enable `optimizeDeps.force: true`.
  - *Why*: Guarantees a single module identity in browser memory across both pre-bundled vendor chunks (`@tanstack/react-query`, `@radix-ui/react-alert-dialog`, `motion/react`) and source `.tsx` files.
- **Decision 2: Parallel Boot Pre-Warming & Vendor Chunk Splitting**
  - *Chosen Approach*: Trigger non-blocking `fetch` pre-warming for `/api/session` and initial state scopes inside `preloadCriticalAppModules()` while splitting heavy vendor libraries into dedicated cacheable chunks (`react-vendor`, `query-vendor`, `motion-vendor`, `ui-vendor`).
  - *Why*: Cuts down critical-path network waterfall time by overlapping chunk evaluation with initial session/state hydration, and keeps individual JS bundles smaller and faster to parse.
- **Decision 3: Broad Browser & WebView Compatibility (`es2020`, Safe Storage, Safe `matchMedia`)**
  - *Chosen Approach*: Target `es2020` in Vite build output, add legacy `addListener`/`removeListener` fallbacks for `MediaQueryList`, guard `localStorage` and `matchMedia` calls against restricted environments, and include `100vh` fallbacks alongside `100dvh`.
  - *Why*: Smart TV browsers (Fire TV Silk), older iOS Safari versions, and restricted privacy contexts frequently throw on unguarded `localStorage` access or lack newer CSS/DOM APIs.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                Vite Build & Module Resolution Layer (ES2020)            │
│  • Hard Alias + Dedupe: react, react-dom, react/jsx-runtime, client     │
│  • Vendor Chunks: react-vendor | query-vendor | motion-vendor | ui      │
│  • Parallel Boot Preload: AppWorkspaceShell + Active Tab + Session/API  │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │ Single React 19 Dispatcher
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              Root Entry (Safe Storage & matchMedia Guards)              │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │               GlobalErrorBoundary (Root Crash Guard)              │  │
│  │  ┌─────────────────────────────────────────────────────────────┐  │  │
│  │  │                        AppProviders                         │  │  │
│  │  │  QueryClient ──► User ──► ProfilePin ──► Toast ──►          │  │  │
│  │  │  PwaInstall ──► Viewport (useEffect DOM sync) ──► Theme     │  │  │
│  │  │  ┌───────────────────────────────────────────────────────┐  │  │  │
│  │  │  │               App Shell & Workspace                   │  │  │  │
│  │  │  │  • ViewportFrame + Vignette + CRT Entrance Canvas     │  │  │  │
│  │  │  │  • WorkspaceErrorBoundary ──► AppWorkspaceShell       │  │  │  │
│  │  │  │  • ResilientImage (no-referrer + ObjectURL cleanup)   │  │  │  │
│  │  │  └───────────────────────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State**:
  - **Singleton React Dispatcher**: All hooks (`useState`, `useEffect`, `useMemo`, `useCallback`, `useContext`, `useSyncExternalStore`) across both application source code and pre-bundled vendor chunks resolve to the same internal `ReactSharedInternals` dispatcher.
  - **Deduplicated Session & Scope Preload**: `preloadCriticalAppModules()` initiates background warm-up of the workspace shell and active tab module without blocking initial render.
  - **Root Error State**: `GlobalErrorBoundary` tracks `{ hasError, error, errorInfo, errorTime, copiedDump, retryCount }` at the root level above `AppProviders` and is reused cleanly inside `AppWorkspaceShell` without duplicate class definitions.
- **Interactive Component & State Mapping**:
  - **Vite Bundler & Dev Server**: Resolves all React imports to the workspace's canonical React installation, forces a fresh dependency optimization pass (`force: true`), and outputs `es2020`-compatible chunks.
  - **HTML Entry & Font Loader**: Uses non-blocking font loading (`media="print"` onload swap) with `100vh` + `100dvh` root spinner styling, and avoids injecting duplicate `<link>` tags in `loadFeatureFonts()`.
  - **Compatibility Guards (`dom.ts`, `providerContexts.tsx`, `main.tsx`, `App.tsx`)**: Safely handles `matchMedia` change subscriptions with `addEventListener` / `addListener` fallback and wraps `localStorage` operations in `try/catch`.
  - **Image Pipeline (`useResilientImage.ts`, `Y2kImage.tsx`)**: Adds `referrerPolicy="no-referrer"` to `<img>` elements and revokes temporary `blob:` URLs on cleanup to prevent memory bloat during long browsing sessions.
