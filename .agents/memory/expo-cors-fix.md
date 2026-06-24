---
name: Expo CORS fix
description: Expo web preview runs on a different subdomain and gets blocked by CORS when calling the main app's API.
---

The Expo dev server runs at `*.expo.janeway.replit.dev` while the main Vite web app (electron artifact) runs at `*.janeway.replit.dev`. Browser fetch from the Expo origin to the Vite app fails with CORS preflight errors.

**Fix:** Add `cors: true` to the Vite server config's `server` block in `vite.config.ts`. This makes Vite set `Access-Control-Allow-Origin: *` on all responses in development mode.

```ts
server: {
  cors: true,  // <-- add this
  ...
}
```

**Why:** The two domains are different origins in the browser's security model, even within the same Replit repl. The Expo web bundler's proxy doesn't rewrite cross-origin API calls.

**How to apply:** Any time an Expo artifact in the same workspace needs to call a sibling Vite web app's API endpoints, add `cors: true` to the Vite app's server config.
