# Jules Agent Learnings

## 2024-05-18 - Handling Meta-Issue Tasks

When assigned a task based on an item from a guideline document or template (e.g., .agents/skills/.../SKILL.md), be very careful not to "solve" the issue by simply editing the template to mark it complete. These are meant to be active checklists. Always verify if there are any *actual* violations in the source code (e.g., real TODO comments). If there are none, the correct action is a no-op.

## 2024-05-18 - GitHub Actions pnpm Setup

When using `pnpm/action-setup@v4` in GitHub Actions, avoid hardcoding the `version` in the workflow file (e.g. `.github/workflows/ci.yml`) if `package.json` already defines it via the `packageManager` field. Specifying conflicting versions causes the setup action to fail with `ERR_PNPM_BAD_PM_VERSION`.

## 2026-06-20 - UI Prune: Unified MagicToggle and Search Elements

Unified scattered inputs and UI toggles using reusable components like MagicToggle. Maintained focus management logic where required.

## 2026-06-24 - Centralized Logger Abstraction

Extracted raw `console.warn` and `console.error` calls into a dedicated `logger` utility for the Electron session API to prevent unhandled raw console logs. This provides a cleaner architecture, allows for unified error tracking in the future (e.g. by wrapping Pino), and sets a standard for logging code health across API files.

## 2026-08-05 - Optimize Array Lookup in useMovies Metadata Refresh

- Replaced `currentMovies.some(...)` (O(N^2) complexity within the filter) with `Set.has(...)` (O(N) complexity) when filtering valid metadata updates in `src/hooks/movies/useMovies.ts`.
- Pre-computed the Set of current movie IDs using a `for...of` loop instead of chained array methods to avoid intermediate allocations.
- Benchmarked a dramatic improvement from ~11,450ms down to ~67ms for 50k mock movies.
