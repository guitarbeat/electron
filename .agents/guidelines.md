# Project guidelines

Agent-facing conventions for this repo. Human docs: [`docs/README.md`](../docs/README.md) (index), [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md), [`docs/DEVELOPMENT.md`](../docs/DEVELOPMENT.md).

## Overview

Collaborative movie-night app for two people: **React 19**, **TypeScript**, **Vite**, Y2K-inspired UI. Default persistence is **localStorage**; optional **Neon Postgres** sync when `DATABASE_URL` is configured (see [`docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md)).

## Conventions

- Prefer extending existing feature files over new one-off modules when the change is small.
- Shared helpers belong in `src/utils/` when multiple features need them.
- Styling: prefer `src/app/App.scss` and co-located SCSS where the project already uses it.

## Git troubleshooting

If `git status` hangs or leaves a stale `.git/index.lock`, remove the lock (`rm -f .git/index.lock`) and retry. For large diffs, use path-scoped commands: `git diff HEAD -- AGENTS.md .agents/`. Bulk dirs (`.migration-backup/`, `.agents/sessions/`, `.vercel/`) are gitignored to keep the index fast.
