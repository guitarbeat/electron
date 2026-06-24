---
name: Electron React deduplication
description: Must use resolve.dedupe + alias in vite.config.ts to prevent multiple React instances when lazy-loading chunks in the electron artifact.
---

# Rule
Add `resolve.dedupe: ["react", "react-dom"]` alongside the `resolve.alias` pointing React to the local node_modules copy.

**Why:** Without `dedupe`, lazy-loaded chunks (`React.lazy(() => import(...))`) can pick up a different React copy from the workspace root or a nested node_modules, causing "Invalid hook call" and "Failed to fetch dynamically imported module" errors.

**How to apply:**
```ts
resolve: {
  dedupe: ["react", "react-dom"],
  alias: {
    react: resolveFromRoot("node_modules/react"),
    "react-dom": resolveFromRoot("node_modules/react-dom"),
  },
}
```
