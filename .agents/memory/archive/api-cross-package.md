---
name: API Cross-Package Bundling
description: How to handle shared frontend code needed by the api-server (esbuild bundling constraint)
---

## The Problem
esbuild (used by api-server build) bundles all imports into a single output file. It cannot follow imports that resolve to files outside the api-server package (e.g., `../../../../electron/src/...`). This causes build failures.

## The Solution
Copy all needed frontend source files into the api-server src tree:
- `artifacts/api-server/src/electron-api/src/` — contains shared types, utils, services, components
- `artifacts/api-server/src/electron-api/lib/` — contains the original API _lib helpers
- `artifacts/api-server/src/electron-api/handlers/` — contains the API handler files

Then fix all import paths in copied files to use relative paths within the api-server tree.

**How to apply:** When adding new API handlers that import from the frontend src, copy the needed src files into `artifacts/api-server/src/electron-api/src/` and update imports.

## Import Path Fixing Rules
- Original `../../src/` in lib files → `../src/` (one level up from lib/)
- Original `../../../src/` in handlers → `../src/` (handlers are in handlers/)
- Original `./_lib/` in handlers → `../lib/`
- Original `@/shared/types` alias → relative path like `../../shared/types.ts`
