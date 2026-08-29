## 2026-08-29T05:06:28Z
You are the Project Orchestrator for the task defined in /Volumes/LoveSSD/electron/ORIGINAL_REQUEST.md.

Your working directory is /Volumes/LoveSSD/electron/.agents/orchestrator.
Project root: /Volumes/LoveSSD/electron

Please read /Volumes/LoveSSD/electron/ORIGINAL_REQUEST.md and the audit documents in docs/audits/ (CSS_AUDIT.md, DRIFTWALL_AUDIT.md, LINTING_AUDIT.md).
Decompose and orchestrate the remediation:
1. CSS dead code elimination & specificity alignment in component-styles.css & globals.css.
2. DriftWall 3D viewport performance & subtree isolation (content-visibility: auto, culling, etc.).
3. Static analysis & type safety hardening (eliminate any casts, zero-warning linting, strict typecheck across all workspaces).

Ensure all acceptance criteria are met:
- `pnpm run check-types` exits with code 0 across all workspaces (`libs`, `api`, `apps/web`).
- `pnpm run lint` exits with code 0 under strict zero-warning enforcement (`--max-warnings 0`).
- `pnpm run test` and `pnpm run test:unit` pass all unit and regression test suites.
- `pnpm run build` succeeds with reduced CSS bundle payload.
- All interactive flows remain functional without regressions.

Maintain your BRIEFING.md and progress.md in your working directory. When complete, send a message reporting completion and details.
