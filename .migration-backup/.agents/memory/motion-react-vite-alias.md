---
name: motion/react Vite alias fix
description: When adding motion/react (Framer Motion v11+) to a Vite/React app, you must alias react and react-dom in vite.config.ts or you get "Invalid hook call / Cannot read properties of null (reading 'useRef')" at runtime.
---

## The rule

Any time `motion` or `motion/react` is installed in a Vite + React project, add explicit aliases in `vite.config.ts` so the package resolves the same React instance as the app:

```ts
resolve: {
  alias: {
    ...existingAliases,
    react:     path.resolve(__dirname, 'node_modules/react'),
    'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
  },
},
```

**Why:** Without the alias, Vite's dependency pre-bundling can end up with two copies of React — one for the app and one bundled inside `motion/react`. React hooks throw "Invalid hook call" when called from a different React instance than the renderer.

**How to apply:** Add these two lines to the `alias` object in `resolve` whenever `motion` is newly installed. Check vite.config.ts first — if the alias is already there, skip it.
