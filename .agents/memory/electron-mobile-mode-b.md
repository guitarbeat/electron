---
name: Electron-Mobile Mode B pattern
description: How the mobile companion app connects to the Electron web app's API (no @workspace/api-client-react).
---

The Electron web app uses a hand-written fetch layer in `artifacts/electron/src/services/` calling its own `/api/*` SSR routes. It does NOT use `@workspace/api-client-react`.

**Mobile companion approach (Mode B):**
- Created `lib/api.ts` in the Expo artifact with a simple `apiFetch` wrapper
- Uses `process.env.EXPO_PUBLIC_DOMAIN` as base URL: `https://${EXPO_PUBLIC_DOMAIN}/api/*`
- Mutation format: POST to `/api/state/{scope}/mutate` with body `{ baseVersion, op, payload }`
- Session is stored locally in AsyncStorage (selectedUser), not via server session cookies
- Do NOT use `setBaseUrl` from `@workspace/api-client-react`

**Key API endpoints:**
- `GET /api/state/movies` → `{ data: Movie[], version, degraded }`
- `GET /api/state/places` → `{ data: Place[], version, degraded }`
- `GET /api/state/memories` → `{ data: SharedMemory[], version, degraded }`
- `POST /api/state/movies/mutate` → ops: `add_movie`, `toggle_watched`, `delete_movie`
- `POST /api/state/places/mutate` → ops: `add_place`, `mark_visited`, `remove_place`
- `GET /api/omdb?s=query` → OMDB movie search

**Why:** The web app's API layer is tightly coupled to its Vite SSR setup, not the shared api-server or api-spec. The mobile app must target the electron artifact's domain directly.
